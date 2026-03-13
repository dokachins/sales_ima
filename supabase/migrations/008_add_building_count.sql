-- companies に見込み棟数を追加
ALTER TABLE public.companies
  ADD COLUMN building_count integer;
