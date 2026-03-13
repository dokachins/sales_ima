-- ============================================================
-- 折衝履歴の INSERT ポリシーを company_id 対応に修正
-- deal_id が NULL のとき（見込み先からの追加）も許可する
-- ============================================================

DROP POLICY IF EXISTS "interaction_logs_insert_participants" ON public.interaction_logs;

CREATE POLICY "interaction_logs_insert_participants"
  ON public.interaction_logs FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    -- deal_id がある場合: 案件の参加者チェック
    OR (deal_id IS NOT NULL AND is_deal_participant(deal_id))
    -- company_id がある場合: 見込み先の主担当・関係者チェック
    OR (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = company_id
        AND (
          owner_user_id = auth.uid()
          OR main_contact_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.company_members
            WHERE company_id = companies.id AND user_id = auth.uid()
          )
        )
    ))
  );
