-- ============================================================
-- サンプルデータ投入
-- ※ 実行前に以下の手順でユーザーIDを確認してください
--   SELECT id, name FROM public.users;
-- ============================================================

-- 一時的に既存ユーザーのIDを変数として使う
DO $$
DECLARE
  -- 既存ユーザーのIDを自動取得（最大3名）
  uid1 uuid;
  uid2 uuid;
  uid3 uuid;

  -- 架空の追加ユーザー
  fake1 uuid := gen_random_uuid();
  fake2 uuid := gen_random_uuid();

  -- 見込み先のID（折衝履歴で参照）
  cid1 uuid := gen_random_uuid();
  cid2 uuid := gen_random_uuid();
  cid3 uuid := gen_random_uuid();
  cid4 uuid := gen_random_uuid();
  cid5 uuid := gen_random_uuid();
  cid6 uuid := gen_random_uuid();
  cid7 uuid := gen_random_uuid();

BEGIN
  -- 既存ユーザーを取得
  SELECT id INTO uid1 FROM public.users ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO uid2 FROM public.users ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO uid3 FROM public.users ORDER BY created_at LIMIT 1 OFFSET 2;

  -- uid2/uid3 が NULL（ユーザーが少ない）場合は uid1 で代用
  uid2 := COALESCE(uid2, uid1);
  uid3 := COALESCE(uid3, uid1);

  -- ============================================================
  -- 架空の追加ユーザーを auth.users なしで public.users に直接追加
  -- ※ auth.users に FK があるため、実際のログインはできないが表示名として使用
  -- ============================================================
  -- 注意: auth.users への参照制約があるため、架空ユーザーは追加できません
  -- 代わりに既存ユーザーを担当者として使用します

  -- ============================================================
  -- 見込み先データ（7社）
  -- ============================================================
  INSERT INTO public.companies (
    id, company_name, owner_user_id, main_contact_user_id,
    status, expectation_rank, next_meeting_date,
    target_sales, expected_gross_profit,
    competitor_name, competitor_memo,
    last_contact_date, is_important, notes,
    updated_by, created_at, updated_at
  ) VALUES
  (
    cid1, '株式会社グリーンホーム', uid1, uid1,
    '商談中', 'A', CURRENT_DATE + 5,
    50000000, 8000000,
    '〇〇ハウジング', '価格面で競合。先方は見積もり提出済み。当社は提案力で差別化',
    CURRENT_DATE - 3, true,
    '社長の息子が建築士。設計にこだわりが強い。次回は3Dプランを持参予定',
    uid1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'
  ),
  (
    cid2, '田中工務店', uid1, uid1,
    'ヒアリング済み', 'B', CURRENT_DATE + 12,
    30000000, 4500000,
    NULL, NULL,
    CURRENT_DATE - 7, false,
    'リフォーム部門の強化を検討中。既存の協力会社との関係を整理してから決定したい意向',
    uid1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '7 days'
  ),
  (
    cid3, '有限会社さくらリフォーム', uid2, uid2,
    '提案中', 'A', CURRENT_DATE + 3,
    80000000, 12000000,
    '△△建設', '工期の短さをアピールしてきている。当社は品質保証とアフターを押す',
    CURRENT_DATE - 1, true,
    '2年前に一度商談したが予算合わず失注。今回リベンジ案件。決裁者は常務',
    uid2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'
  ),
  (
    cid4, '松本建設株式会社', uid2, uid2,
    '接触中', 'C', NULL,
    20000000, 3000000,
    NULL, NULL,
    CURRENT_DATE - 14, false,
    '展示会で名刺交換。まだ具体的ニーズ不明。定期的にフォローを続ける',
    uid2, NOW() - INTERVAL '30 days', NOW() - INTERVAL '14 days'
  ),
  (
    cid5, '株式会社ネクストホーム', uid3, uid3,
    '未接触', 'B', NULL,
    40000000, 6000000,
    NULL, NULL,
    NULL, false,
    'HPで見つけた。新築分譲事業を拡大中の模様。アプローチタイミングを検討中',
    uid3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  ),
  (
    cid6, '旭ホールディングス', uid1, uid1,
    '接触中', 'B', CURRENT_DATE + 20,
    60000000, 9000000,
    NULL, NULL,
    CURRENT_DATE - 35, false,
    '大手グループ。意思決定に時間がかかるが成約すれば大口。購買担当と関係構築中',
    uid1, NOW() - INTERVAL '40 days', NOW() - INTERVAL '35 days'
  ),
  (
    cid7, '中村不動産株式会社', uid2, uid2,
    '受注', 'A', NULL,
    45000000, 7000000,
    NULL, NULL,
    CURRENT_DATE - 60, false,
    '今期成約済み。来期も継続取引の可能性あり。フォロー継続',
    uid2, NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days'
  );

  -- ============================================================
  -- 関係者営業（company_members）
  -- ============================================================
  INSERT INTO public.company_members (company_id, user_id) VALUES
    (cid1, uid2),   -- グリーンホームにuid2も参加
    (cid3, uid1),   -- さくらリフォームにuid1も参加
    (cid6, uid3);   -- 旭HDにuid3も参加

  -- ============================================================
  -- 折衝履歴
  -- ============================================================
  INSERT INTO public.interaction_logs (
    company_id, deal_id, action_date, action_type, content,
    next_action, next_action_date, created_by, created_at, updated_at
  ) VALUES
  -- グリーンホーム（cid1）
  (cid1, NULL, CURRENT_DATE - 30, '訪問', '初回訪問。代表の山本社長と面談。新築事業の外壁・屋根工事について概要説明。予算感は5000万前後とのこと。', '資料持参で再訪', CURRENT_DATE - 20, uid1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  (cid1, NULL, CURRENT_DATE - 20, '訪問', '詳細ヒアリング。使用素材の希望（高耐久・低メンテナンス重視）を確認。設計士の息子さんも同席。3Dプランを見たいとのリクエストあり。', '3Dプラン作成して持参', CURRENT_DATE - 10, uid1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  (cid1, NULL, CURRENT_DATE - 10, '提案', '3Dパースと概算見積もり提出。先方から競合他社（〇〇ハウジング）も見積もりを取っているとの情報。価格より品質・アフターを押す方針で対応。', '価格交渉の準備・決裁者へのアプローチ', CURRENT_DATE + 5, uid2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (cid1, NULL, CURRENT_DATE - 3, '電話', '進捗確認の電話。社内調整中とのこと。来週打ち合わせ設定。競合との比較検討が続いている模様。', NULL, NULL, uid1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  -- さくらリフォーム（cid3）
  (cid3, NULL, CURRENT_DATE - 15, '訪問', '2年ぶりの再訪。今回は常務が同席。前回失注の反省を踏まえ、まず常務との関係構築を優先。今期の予算は8000万を確保済みとのこと。', 'ヒアリングシートをまとめて再提案', CURRENT_DATE - 5, uid2, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  (cid3, NULL, CURRENT_DATE - 5, '提案', '正式提案書を提出。品質保証5年・アフターメンテナンスの充実を前面に出した内容。常務から「前回よりだいぶ良くなった」とコメントあり。競合との最終比較に入った模様。', '最終決裁を促すフォロー', CURRENT_DATE + 3, uid2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (cid3, NULL, CURRENT_DATE - 1, '電話', '常務から電話あり。細部の確認事項を聞かれた。アフターメンテナンスの対応エリアと工期について追加資料を求められた。', '追加資料の送付', CURRENT_DATE + 1, uid1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  -- 田中工務店（cid2）
  (cid2, NULL, CURRENT_DATE - 20, '訪問', '初回ヒアリング。リフォーム部門強化のため外部パートナーを探しているとのこと。既存の協力会社3社と比較検討中。', '協力会社実績資料の送付', CURRENT_DATE - 10, uid1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  (cid2, NULL, CURRENT_DATE - 7, 'メール', '実績資料と単価表を送付。担当者から受領確認の返信あり。社内検討に1ヶ月程度かかる見込みとのこと。', 'フォローアップ電話', CURRENT_DATE + 12, uid1, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

  -- 松本建設（cid4）
  (cid4, NULL, CURRENT_DATE - 14, '電話', '展示会での名刺交換後のフォロー電話。今すぐの案件はないが半年後に大型案件が動く可能性があるとのこと。定期連絡を続けることを約束。', '2週間後に再度連絡', CURRENT_DATE, uid2, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

  -- 旭HD（cid6）
  (cid6, NULL, CURRENT_DATE - 35, '訪問', '購買担当の鈴木氏と初回面談。グループ全体の調達コスト削減を進めているとのこと。まずは単発案件でトライアルしたいとの意向。', '提案資料の作成', CURRENT_DATE - 25, uid1, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days');

  RAISE NOTICE 'サンプルデータの投入が完了しました。uid1=%, uid2=%, uid3=%', uid1, uid2, uid3;
END $$;
