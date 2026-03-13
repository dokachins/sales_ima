-- ============================================================
-- interaction_logs の INSERT ポリシーを全認証ユーザーに開放
-- 理由: 会社詳細は全員が閲覧可能なため、折衝履歴の追加も
--       担当者に限定せず全認証ユーザーに許可する（companies と同じ方針）
-- 編集・削除は引き続き作成者/管理者のみ
-- ============================================================

DROP POLICY IF EXISTS "interaction_logs_insert_participants" ON public.interaction_logs;

CREATE POLICY "interaction_logs_insert_authenticated"
  ON public.interaction_logs FOR INSERT TO authenticated
  WITH CHECK (true);
