-- ============================================================
-- IMA Sales MVP - Triggers
-- ============================================================

-- ============================================================
-- 汎用 updated_at 更新関数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER interaction_logs_updated_at
  BEFORE UPDATE ON public.interaction_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- auth.users 登録時にプロフィールを自動作成
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- 折衝履歴の変更時に deals.last_contact_date / updated_at / updated_by を同期
--
-- ルール:
--   - last_contact_date = その案件の interaction_logs.action_date の最大値
--   - updated_by        = 操作した人（INSERT: created_by, UPDATE: updated_by）
-- ============================================================
CREATE OR REPLACE FUNCTION sync_deal_on_log_change()
RETURNS TRIGGER AS $$
DECLARE
  v_deal_id        uuid;
  v_max_date       date;
  v_updated_by     uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_deal_id := OLD.deal_id;
  ELSE
    v_deal_id := NEW.deal_id;
  END IF;

  -- その案件の最新 action_date を取得（削除の場合は削除行を除外）
  SELECT MAX(action_date)
  INTO v_max_date
  FROM public.interaction_logs
  WHERE deal_id = v_deal_id
    AND (TG_OP != 'DELETE' OR id != OLD.id);

  IF TG_OP = 'DELETE' THEN
    UPDATE public.deals
    SET
      last_contact_date = v_max_date,
      updated_at        = now()
    WHERE id = v_deal_id;
    RETURN OLD;
  END IF;

  -- INSERT または UPDATE
  v_updated_by := COALESCE(NEW.updated_by, NEW.created_by);

  UPDATE public.deals
  SET
    last_contact_date = v_max_date,
    updated_at        = now(),
    updated_by        = v_updated_by
  WHERE id = v_deal_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_deal_on_log_change
  AFTER INSERT OR UPDATE OR DELETE ON public.interaction_logs
  FOR EACH ROW EXECUTE FUNCTION sync_deal_on_log_change();
