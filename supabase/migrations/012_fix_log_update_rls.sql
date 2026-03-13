-- ============================================================
-- interaction_logs の UPDATE ポリシーを全認証ユーザーに開放
-- 理由: 完了ボタン（next_action/next_action_date をクリア）が
--       ログ作成者以外には失敗していたため。INSERT と同じ方針に統一。
-- ============================================================

DROP POLICY IF EXISTS "interaction_logs_update_creator_or_admin" ON public.interaction_logs;

CREATE POLICY "interaction_logs_update_authenticated"
  ON public.interaction_logs FOR UPDATE TO authenticated
  USING (true);
