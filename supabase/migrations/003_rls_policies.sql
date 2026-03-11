-- ============================================================
-- IMA Sales MVP - Row Level Security Policies
-- ============================================================

ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ヘルパー関数
-- ============================================================

-- 現在のユーザーが admin かどうか
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 現在のユーザーが特定の案件の主担当または関係者かどうか
CREATE OR REPLACE FUNCTION is_deal_participant(p_deal_id uuid)
RETURNS boolean AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.deals       WHERE id = p_deal_id AND owner_user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.deal_members WHERE deal_id = p_deal_id AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS
-- ============================================================
-- 全認証ユーザーが全ユーザー情報を参照可能（担当者ドロップダウン等に使用）
CREATE POLICY "users_select_all"
  ON public.users FOR SELECT TO authenticated
  USING (true);

-- 自分自身 or 管理者のみ更新可能
CREATE POLICY "users_update_self_or_admin"
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_admin());

-- ============================================================
-- COMPANIES
-- ============================================================
-- 全認証ユーザーが参照可能
CREATE POLICY "companies_select_all"
  ON public.companies FOR SELECT TO authenticated
  USING (true);

-- 全認証ユーザーが作成可能
CREATE POLICY "companies_insert_authenticated"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- 全認証ユーザーが更新可能（MVP: 編集権限はオープン）
CREATE POLICY "companies_update_authenticated"
  ON public.companies FOR UPDATE TO authenticated
  USING (true);

-- 管理者のみ削除可能
CREATE POLICY "companies_delete_admin"
  ON public.companies FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================
-- DEALS
-- ============================================================
-- 全認証ユーザーが全案件を参照可能（重複営業防止のため全件閲覧を許可）
CREATE POLICY "deals_select_all"
  ON public.deals FOR SELECT TO authenticated
  USING (true);

-- 全認証ユーザーが作成可能
CREATE POLICY "deals_insert_authenticated"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (true);

-- 主担当・関係者・管理者のみ更新可能
CREATE POLICY "deals_update_participants"
  ON public.deals FOR UPDATE TO authenticated
  USING (is_admin() OR is_deal_participant(id));

-- 管理者のみ削除可能
CREATE POLICY "deals_delete_admin"
  ON public.deals FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================
-- DEAL_MEMBERS
-- ============================================================
-- 全認証ユーザーが参照可能
CREATE POLICY "deal_members_select_all"
  ON public.deal_members FOR SELECT TO authenticated
  USING (true);

-- 主担当または管理者のみ関係者を追加可能
CREATE POLICY "deal_members_insert_owner_or_admin"
  ON public.deal_members FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE id = deal_id AND owner_user_id = auth.uid()
    )
  );

-- 主担当または管理者のみ関係者を削除可能
CREATE POLICY "deal_members_delete_owner_or_admin"
  ON public.deal_members FOR DELETE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.deals
      WHERE id = deal_id AND owner_user_id = auth.uid()
    )
  );

-- ============================================================
-- INTERACTION_LOGS
-- ============================================================
-- 全認証ユーザーが参照可能
CREATE POLICY "interaction_logs_select_all"
  ON public.interaction_logs FOR SELECT TO authenticated
  USING (true);

-- 案件の参加者（主担当・関係者）または管理者のみ作成可能
CREATE POLICY "interaction_logs_insert_participants"
  ON public.interaction_logs FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_deal_participant(deal_id));

-- 作成者または管理者のみ更新可能
CREATE POLICY "interaction_logs_update_creator_or_admin"
  ON public.interaction_logs FOR UPDATE TO authenticated
  USING (is_admin() OR created_by = auth.uid());

-- 作成者または管理者のみ削除可能
CREATE POLICY "interaction_logs_delete_creator_or_admin"
  ON public.interaction_logs FOR DELETE TO authenticated
  USING (is_admin() OR created_by = auth.uid());
