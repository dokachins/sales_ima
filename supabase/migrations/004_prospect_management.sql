-- ============================================================
-- IMA Sales MVP - 見込み先管理化マイグレーション
-- companies テーブルを主役に昇格させる
-- ============================================================

-- ============================================================
-- 1. companies に見込み先管理フィールドを追加
-- ============================================================
ALTER TABLE public.companies
  ADD COLUMN owner_user_id        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN status               text NOT NULL DEFAULT '未接触'
                                    CHECK (status IN ('未接触','接触中','ヒアリング済み','提案中','商談中','受注','失注','保留')),
  ADD COLUMN expectation_rank     text CHECK (expectation_rank IN ('A','B','C','D','E')),
  ADD COLUMN next_meeting_date    date,
  ADD COLUMN competitor_name      text,
  ADD COLUMN competitor_memo      text,
  ADD COLUMN target_sales         numeric,
  ADD COLUMN expected_gross_profit numeric,
  ADD COLUMN last_contact_date    date,
  ADD COLUMN updated_by           uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN is_important         boolean NOT NULL DEFAULT false;

-- main_contact_user_id は残す（後方互換）、owner_user_id を主として使う
-- 既存の main_contact_user_id を owner_user_id にコピー
UPDATE public.companies SET owner_user_id = main_contact_user_id WHERE owner_user_id IS NULL;

CREATE INDEX idx_companies_owner       ON public.companies(owner_user_id);
CREATE INDEX idx_companies_status      ON public.companies(status);
CREATE INDEX idx_companies_expectation ON public.companies(expectation_rank);
CREATE INDEX idx_companies_important   ON public.companies(is_important) WHERE is_important = true;
CREATE INDEX idx_companies_next_meet   ON public.companies(next_meeting_date);
CREATE INDEX idx_companies_last_contact ON public.companies(last_contact_date);

-- ============================================================
-- 2. 会社メンバー（関係者）テーブル
-- ============================================================
CREATE TABLE public.company_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_members_company ON public.company_members(company_id);
CREATE INDEX idx_company_members_user    ON public.company_members(user_id);

-- ============================================================
-- 3. interaction_logs を会社単位に対応
--    deal_id をオプションに、company_id を追加
-- ============================================================
ALTER TABLE public.interaction_logs
  ALTER COLUMN deal_id DROP NOT NULL,
  ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX idx_logs_company_id ON public.interaction_logs(company_id);

-- ============================================================
-- 4. 折衝履歴変更時に companies.last_contact_date を同期するトリガー
-- ============================================================
CREATE OR REPLACE FUNCTION sync_company_on_log_change()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_max_date   date;
  v_updated_by uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_company_id := OLD.company_id;
  ELSE
    v_company_id := NEW.company_id;
  END IF;

  IF v_company_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT MAX(action_date)
  INTO v_max_date
  FROM public.interaction_logs
  WHERE company_id = v_company_id
    AND (TG_OP != 'DELETE' OR id != OLD.id);

  IF TG_OP = 'DELETE' THEN
    UPDATE public.companies
    SET last_contact_date = v_max_date, updated_at = now()
    WHERE id = v_company_id;
    RETURN OLD;
  END IF;

  v_updated_by := COALESCE(NEW.updated_by, NEW.created_by);

  UPDATE public.companies
  SET
    last_contact_date = v_max_date,
    updated_at        = now(),
    updated_by        = v_updated_by
  WHERE id = v_company_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_company_on_log_change
  AFTER INSERT OR UPDATE OR DELETE ON public.interaction_logs
  FOR EACH ROW EXECUTE FUNCTION sync_company_on_log_change();

-- ============================================================
-- 5. RLS for company_members
-- ============================================================
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_select_all"
  ON public.company_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "company_members_insert_owner_or_admin"
  ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = company_id AND (owner_user_id = auth.uid() OR main_contact_user_id = auth.uid())
    )
  );

CREATE POLICY "company_members_delete_owner_or_admin"
  ON public.company_members FOR DELETE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = company_id AND (owner_user_id = auth.uid() OR main_contact_user_id = auth.uid())
    )
  );
