-- building_count カラム追加（未実行の場合のみ）
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS building_count integer;

-- サンプルデータに棟数を設定
UPDATE public.companies SET building_count = 8  WHERE company_name = '株式会社グリーンホーム';
UPDATE public.companies SET building_count = 5  WHERE company_name = '有限会社さくらリフォーム';
UPDATE public.companies SET building_count = 3  WHERE company_name = '田中工務店';
UPDATE public.companies SET building_count = 10 WHERE company_name = '旭ホールディングス';
UPDATE public.companies SET building_count = 6  WHERE company_name = '松本建設株式会社';
UPDATE public.companies SET building_count = 4  WHERE company_name = '株式会社ネクストホーム';
UPDATE public.companies SET building_count = 7  WHERE company_name = '中村不動産株式会社';
UPDATE public.companies SET building_count = 5  WHERE company_name = '株式会社サンライズ建設';
UPDATE public.companies SET building_count = 3  WHERE company_name = '北島リフォーム工業';
UPDATE public.companies SET building_count = 2  WHERE company_name = '藤田ハウジング株式会社';
UPDATE public.companies SET building_count = 9  WHERE company_name = '丸山建設株式会社';
UPDATE public.companies SET building_count = 4  WHERE company_name = '東洋ホーム株式会社';
