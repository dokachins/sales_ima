-- ============================================================
-- サンプルデータリセット＆再投入
-- ホーム画面の3ウィジェットが全て可視化されるデータ
-- ============================================================

-- 既存サンプルデータを削除（interaction_logs → company_members → companies の順）
DELETE FROM public.interaction_logs WHERE company_id IN (
  SELECT id FROM public.companies WHERE company_name IN (
    '株式会社グリーンホーム','田中工務店','有限会社さくらリフォーム',
    '松本建設株式会社','株式会社ネクストホーム','旭ホールディングス','中村不動産株式会社'
  )
);
DELETE FROM public.company_members WHERE company_id IN (
  SELECT id FROM public.companies WHERE company_name IN (
    '株式会社グリーンホーム','田中工務店','有限会社さくらリフォーム',
    '松本建設株式会社','株式会社ネクストホーム','旭ホールディングス','中村不動産株式会社'
  )
);
DELETE FROM public.companies WHERE company_name IN (
  '株式会社グリーンホーム','田中工務店','有限会社さくらリフォーム',
  '松本建設株式会社','株式会社ネクストホーム','旭ホールディングス','中村不動産株式会社'
);

DO $$
DECLARE
  uid1 uuid;
  uid2 uuid;
  uid3 uuid;

  -- 見込み先ID
  cid1  uuid := gen_random_uuid(); -- 今日打ち合わせ
  cid2  uuid := gen_random_uuid(); -- 今日打ち合わせ
  cid3  uuid := gen_random_uuid(); -- 明日打ち合わせ
  cid4  uuid := gen_random_uuid(); -- 重要×長期未接触①
  cid5  uuid := gen_random_uuid(); -- 重要×長期未接触②
  cid6  uuid := gen_random_uuid(); -- 重要×長期未接触③（未接触）
  cid7  uuid := gen_random_uuid(); -- 商談中・期限切れアクション
  cid8  uuid := gen_random_uuid(); -- 提案中・期限切れアクション
  cid9  uuid := gen_random_uuid(); -- ヒアリング済み
  cid10 uuid := gen_random_uuid(); -- 接触中
  cid11 uuid := gen_random_uuid(); -- 受注（終了）
  cid12 uuid := gen_random_uuid(); -- 失注（終了）
BEGIN
  SELECT id INTO uid1 FROM public.users ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO uid2 FROM public.users ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO uid3 FROM public.users ORDER BY created_at LIMIT 1 OFFSET 2;
  uid2 := COALESCE(uid2, uid1);
  uid3 := COALESCE(uid3, uid1);

  -- ============================================================
  -- 見込み先データ
  -- ============================================================
  INSERT INTO public.companies (
    id, company_name, owner_user_id, main_contact_user_id,
    status, expectation_rank, next_meeting_date,
    target_sales, expected_gross_profit,
    competitor_name, competitor_memo,
    last_contact_date, is_important, notes,
    updated_by, created_at, updated_at
  ) VALUES

  -- ① 今日打ち合わせ（商談中・重要）
  (cid1, '株式会社グリーンホーム', uid1, uid1,
    '商談中', 'A', CURRENT_DATE,
    50000000, 8000000,
    '〇〇ハウジング', '価格面で競合。提案力で差別化中',
    CURRENT_DATE - 3, true,
    '社長の息子が建築士。設計にこだわりが強い。本日最終プレゼン',
    uid1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),

  -- ② 今日打ち合わせ（提案中）
  (cid2, '有限会社さくらリフォーム', uid2, uid2,
    '提案中', 'A', CURRENT_DATE,
    80000000, 12000000,
    '△△建設', '工期の短さをアピールしてきている',
    CURRENT_DATE - 1, true,
    '2年前に失注したリベンジ案件。本日常務との最終確認',
    uid2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

  -- ③ 明日打ち合わせ（ヒアリング済み）
  (cid3, '田中工務店', uid1, uid1,
    'ヒアリング済み', 'B', CURRENT_DATE + 1,
    30000000, 4500000,
    NULL, NULL,
    CURRENT_DATE - 5, false,
    'リフォーム部門強化を検討中。明日提案書を持参予定',
    uid1, NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),

  -- ④ 重要×長期未接触（35日前）
  (cid4, '旭ホールディングス', uid1, uid1,
    '接触中', 'A', NULL,
    60000000, 9000000,
    NULL, NULL,
    CURRENT_DATE - 35, true,
    '大手グループ。購買担当と関係構築中。長期間フォローが止まっている',
    uid1, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),

  -- ⑤ 重要×長期未接触（45日前）
  (cid5, '松本建設株式会社', uid2, uid2,
    '提案中', 'B', NULL,
    40000000, 6000000,
    '▲▲工務店', '競合状況不明。長期間連絡が取れていない',
    CURRENT_DATE - 45, true,
    '大型案件候補。先方の担当者が変わった可能性あり。至急確認が必要',
    uid2, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),

  -- ⑥ 重要×未接触（接触歴なし）
  (cid6, '株式会社ネクストホーム', uid3, uid3,
    '未接触', 'B', NULL,
    40000000, 6000000,
    NULL, NULL,
    NULL, true,
    'HPで見つけた有望先。新築分譲事業を急拡大中。重要フラグを立てたが初回接触がまだ',
    uid3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  -- ⑦ 商談中（期限切れアクションあり）
  (cid7, '中村不動産株式会社', uid1, uid1,
    '商談中', 'A', CURRENT_DATE + 8,
    45000000, 7000000,
    NULL, NULL,
    CURRENT_DATE - 12, false,
    '役員承認待ち。先週フォローアップの予定だったが遅れている',
    uid1, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

  -- ⑧ 提案中（期限切れアクションあり）
  (cid8, '株式会社サンライズ建設', uid2, uid2,
    '提案中', 'B', CURRENT_DATE + 14,
    35000000, 5500000,
    NULL, NULL,
    CURRENT_DATE - 18, false,
    '先週追加資料を送る予定だったが未送付。早急に対応が必要',
    uid2, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),

  -- ⑨ ヒアリング済み（進行中）
  (cid9, '北島リフォーム工業', uid3, uid3,
    'ヒアリング済み', 'C', CURRENT_DATE + 10,
    25000000, 3500000,
    NULL, NULL,
    CURRENT_DATE - 8, false,
    '担当者は乗り気だが上長承認が必要。次回提案書持参',
    uid3, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

  -- ⑩ 接触中（進行中）
  (cid10, '藤田ハウジング株式会社', uid1, uid1,
    '接触中', 'C', NULL,
    20000000, 3000000,
    NULL, NULL,
    CURRENT_DATE - 21, false,
    '展示会で接触。まだ具体的なニーズは不明',
    uid1, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),

  -- ⑪ 受注（終了案件）
  (cid11, '丸山建設株式会社', uid2, uid2,
    '受注', 'A', NULL,
    55000000, 8500000,
    NULL, NULL,
    CURRENT_DATE - 60, false,
    '今期成約。来期も継続取引の可能性あり',
    uid2, NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days'),

  -- ⑫ 失注（終了案件）
  (cid12, '東洋ホーム株式会社', uid3, uid3,
    '失注', 'C', NULL,
    30000000, 4000000,
    '〇〇ハウジング', '価格で負けた。次の機会を待つ',
    CURRENT_DATE - 90, false,
    '今回は失注。担当者とは良好な関係を維持。半年後に再チャレンジ予定',
    uid3, NOW() - INTERVAL '120 days', NOW() - INTERVAL '90 days');

  -- ============================================================
  -- 関係者営業
  -- ============================================================
  INSERT INTO public.company_members (company_id, user_id) VALUES
    (cid1, uid2),
    (cid2, uid1),
    (cid4, uid3),
    (cid7, uid2);

  -- ============================================================
  -- 折衝履歴（期限切れアクションを含む）
  -- ============================================================
  INSERT INTO public.interaction_logs (
    company_id, deal_id, action_date, action_type, content,
    next_action, next_action_date, created_by, created_at, updated_at
  ) VALUES

  -- グリーンホーム（今日打ち合わせ）
  (cid1, NULL, CURRENT_DATE - 20, '訪問',
    '初回訪問。代表の山本社長と面談。新築事業の外壁・屋根工事について概要説明。予算感は5000万前後とのこと。',
    '3Dプランを作成して持参', CURRENT_DATE - 10,
    uid1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  (cid1, NULL, CURRENT_DATE - 10, '提案',
    '3Dパースと概算見積もりを提出。競合他社（〇〇ハウジング）も見積もり取得中とのこと。',
    '最終プレゼンの準備', CURRENT_DATE - 3,
    uid1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (cid1, NULL, CURRENT_DATE - 3, '電話',
    '本日の打ち合わせ確認の電話。社長・息子（建築士）・常務の3名が参加予定とのこと。',
    NULL, NULL,
    uid2, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  -- さくらリフォーム（今日打ち合わせ）
  (cid2, NULL, CURRENT_DATE - 10, '訪問',
    '2年ぶりの再訪。今期予算8000万を確保済みとのこと。常務が同席。',
    '正式提案書を作成して持参', CURRENT_DATE - 5,
    uid2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (cid2, NULL, CURRENT_DATE - 1, '電話',
    '本日の打ち合わせ確認。常務から「今回はしっかり比較したい」とのコメント。決め手は品質保証とアフター対応。',
    NULL, NULL,
    uid2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  -- 田中工務店（明日打ち合わせ）
  (cid3, NULL, CURRENT_DATE - 14, '訪問',
    'リフォーム部門強化のため外部パートナーを探しているとのこと。既存の協力会社3社と比較検討中。',
    '提案書を持参して再訪', CURRENT_DATE + 1,
    uid1, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  (cid3, NULL, CURRENT_DATE - 5, 'メール',
    '実績資料と提案書の概要を送付。担当者から「明日の打ち合わせ楽しみにしています」と返信あり。',
    NULL, NULL,
    uid1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

  -- 旭ホールディングス（重要×35日未接触）
  (cid4, NULL, CURRENT_DATE - 35, '訪問',
    '購買担当の鈴木氏と初回面談。グループ全体の調達コスト削減を進めているとのこと。',
    '提案資料を作成して送付', CURRENT_DATE - 25,
    uid1, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),

  -- 松本建設（重要×45日未接触）
  (cid5, NULL, CURRENT_DATE - 45, '提案',
    '正式提案書を提出。先方の担当者が異動した可能性があり、その後連絡が途絶えている。',
    '新担当者への挨拶訪問', CURRENT_DATE - 30,
    uid2, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),

  -- 中村不動産（期限切れアクション：役員報告フォロー）
  (cid7, NULL, CURRENT_DATE - 12, '会議',
    '役員同席の商談。金額面で役員承認が必要とのこと。1週間で返答をもらう予定だった。',
    '役員承認後の返答を受けて最終調整', CURRENT_DATE - 5,
    uid1, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

  -- サンライズ建設（期限切れアクション：追加資料未送付）
  (cid8, NULL, CURRENT_DATE - 18, '訪問',
    'ヒアリング後の提案訪問。施工事例と保証内容の詳細資料を追加で求められた。',
    '施工事例集と保証内容の詳細資料を送付', CURRENT_DATE - 11,
    uid2, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),

  -- 北島リフォーム（進行中）
  (cid9, NULL, CURRENT_DATE - 8, '電話',
    'ヒアリング後のフォロー電話。担当者は前向きだが上長への稟議が必要とのこと。',
    '提案書を正式に作成して持参', CURRENT_DATE + 10,
    uid3, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

  -- 藤田ハウジング（接触中）
  (cid10, NULL, CURRENT_DATE - 21, '訪問',
    '展示会での名刺交換がきっかけで初訪問。現状のパートナー体制に不満があるとのことで今後に期待。',
    '定期フォローの電話', CURRENT_DATE - 7,
    uid1, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days');

  RAISE NOTICE 'サンプルデータ再投入完了: uid1=%, uid2=%, uid3=%', uid1, uid2, uid3;
END $$;
