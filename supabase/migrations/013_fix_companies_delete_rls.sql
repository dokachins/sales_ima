-- companies の削除権限を「主担当 or admin」に変更
-- 旧: admin のみ（member は RLS で弾かれ error なし 0件削除になっていた）
DROP POLICY "companies_delete_admin" ON public.companies;

CREATE POLICY "companies_delete_owner_or_admin"
  ON public.companies FOR DELETE TO authenticated
  USING (is_admin() OR owner_user_id = auth.uid());
