-- ============================================================
-- サンプルチームメンバーと見込み先データ（チーム動作確認用）
-- Supabase Dashboard → SQL Editor で実行してください
-- ============================================================

DO $$
DECLARE
  -- サンプルメンバーの固定UUID
  v_tanaka   uuid := 'b1b1b1b1-0001-0001-0001-000000000001';
  v_sato     uuid := 'b2b2b2b2-0002-0002-0002-000000000002';
  v_yamamoto uuid := 'b3b3b3b3-0003-0003-0003-000000000003';

  -- 見込み先ID
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  c3 uuid := gen_random_uuid();
  c4 uuid := gen_random_uuid();
  c5 uuid := gen_random_uuid();
  c6 uuid := gen_random_uuid();
  c7 uuid := gen_random_uuid();
  c8 uuid := gen_random_uuid();
  c9 uuid := gen_random_uuid();
BEGIN

  -- ============================================================
  -- auth.users にサンプルユーザーを追加
  -- trigger(handle_new_auth_user) が public.users を自動生成する
  -- ============================================================
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at
  ) VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      v_tanaka, 'authenticated', 'authenticated',
      'tanaka@scout-demo.local',
      crypt('Scout2024!', gen_salt('bf')),
      now(), '{"name":"田中 健二"}'::jsonb, now(), now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      v_sato, 'authenticated', 'authenticated',
      'sato@scout-demo.local',
      crypt('Scout2024!', gen_salt('bf')),
      now(), '{"name":"佐藤 花子"}'::jsonb, now(), now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      v_yamamoto, 'authenticated', 'authenticated',
      'yamamoto@scout-demo.local',
      crypt('Scout2024!', gen_salt('bf')),
      now(), '{"name":"山本 太郎"}'::jsonb, now(), now()
    )
  ON CONFLICT (id) DO NOTHING;

  -- トリガーが email prefix を name にセットするため上書き
  UPDATE public.users SET name = '田中 健二' WHERE id = v_tanaka;
  UPDATE public.users SET name = '佐藤 花子' WHERE id = v_sato;
  UPDATE public.users SET name = '山本 太郎' WHERE id = v_yamamoto;

  -- ============================================================
  -- 田中 健二 担当（3社）
  --   ・商談中A × 重要 × 明日打ち合わせ  → ホーム「今日・明日」に出る
  --   ・ヒアリング済みB × 重要 × 42日未接触 → ホーム「重要×長期未接触」に出る
  --   ・接触中C
  -- ============================================================
  INSERT INTO public.companies (
    id, company_name, owner_user_id, main_contact_user_id,
    status, expectation_rank, next_meeting_date, last_contact_date,
    building_count, expected_gross_profit, target_sales,
    is_important, notes, updated_by, created_at, updated_at
  ) VALUES
  (
    c1, '株式会社ミナミ建設', v_tanaka, v_tanaka,
    '商談中', 'A', CURRENT_DATE + 1, CURRENT_DATE - 4,
    12, 4800000, 32000000,
    true,
    '社長と直接商談中。競合は地元工務店1社。来週の条件提示が山場。設計士の息子さんも同席予定。',
    v_tanaka, now() - interval '15 days', now() - interval '4 days'
  ),
  (
    c2, '有限会社アサヒホーム', v_tanaka, v_tanaka,
    'ヒアリング済み', 'B', NULL, CURRENT_DATE - 42,
    7, 2400000, 18000000,
    true,
    '担当者が変わり引き継ぎ中。長期間連絡が取れていないため要フォロー。前任からの申し送り事項あり。',
    v_tanaka, now() - interval '50 days', now() - interval '42 days'
  ),
  (
    c3, '三浦工務店', v_tanaka, v_tanaka,
    '接触中', 'C', NULL, CURRENT_DATE - 11,
    3, NULL, NULL,
    false,
    '先月初回訪問。若い2代目社長。まだ関係構築段階。月1ペースでフォロー予定。',
    v_tanaka, now() - interval '25 days', now() - interval '11 days'
  );

  -- ============================================================
  -- 佐藤 花子 担当（3社）
  --   ・提案中A × 重要 × 来週打ち合わせ  → パイプライン
  --   ・商談中B × 今日打ち合わせ         → ホーム「今日・明日」に出る
  --   ・未接触D
  -- ============================================================
  INSERT INTO public.companies (
    id, company_name, owner_user_id, main_contact_user_id,
    status, expectation_rank, next_meeting_date, last_contact_date,
    building_count, expected_gross_profit, target_sales,
    is_important, notes, updated_by, created_at, updated_at
  ) VALUES
  (
    c4, '株式会社フジタ建築', v_sato, v_sato,
    '提案中', 'A', CURRENT_DATE + 6, CURRENT_DATE - 3,
    15, 6200000, 48000000,
    true,
    '見積り提出済み。来週の常務プレゼンが鍵。競合2社と比較中だが当社への感触は良好。予算は確保済み。',
    v_sato, now() - interval '10 days', now() - interval '3 days'
  ),
  (
    c5, '西田リフォーム', v_sato, v_sato,
    '商談中', 'B', CURRENT_DATE, CURRENT_DATE - 6,
    5, 1800000, 12000000,
    false,
    '本日打ち合わせ予定。条件面の最終確認。工期と保証内容で詰める。',
    v_sato, now() - interval '20 days', now() - interval '6 days'
  ),
  (
    c6, '株式会社山川住建', v_sato, v_sato,
    '未接触', 'D', NULL, NULL,
    NULL, NULL, NULL,
    false,
    '紹介案件。まだアポ取れていない。来月アプローチ予定。',
    v_sato, now() - interval '5 days', now() - interval '5 days'
  );

  -- ============================================================
  -- 山本 太郎 担当（3社）
  --   ・提案中B × 重要 × 35日未接触   → ホーム「重要×長期未接触」
  --   ・接触中C × 3日後打ち合わせ     → ホーム「今日・明日」には出ない（3日後）
  --   ・ヒアリング済みA × 2週間後     → パイプライン
  -- ============================================================
  INSERT INTO public.companies (
    id, company_name, owner_user_id, main_contact_user_id,
    status, expectation_rank, next_meeting_date, last_contact_date,
    building_count, expected_gross_profit, target_sales,
    is_important, notes, updated_by, created_at, updated_at
  ) VALUES
  (
    c7, '大和建設株式会社', v_yamamoto, v_yamamoto,
    '提案中', 'B', NULL, CURRENT_DATE - 35,
    20, 8500000, 65000000,
    true,
    '大型案件。担当者が多忙で連絡が取れていない。意思決定に時間がかかるが成約すれば今期最大案件。',
    v_yamamoto, now() - interval '40 days', now() - interval '35 days'
  ),
  (
    c8, '株式会社桜木工務店', v_yamamoto, v_yamamoto,
    '接触中', 'C', CURRENT_DATE + 3, CURRENT_DATE - 7,
    6, 2100000, 15000000,
    false,
    '若い経営者。IT活用に積極的で反応が良い。3日後に初回提案予定。',
    v_yamamoto, now() - interval '20 days', now() - interval '7 days'
  ),
  (
    c9, '東京ホームズ株式会社', v_yamamoto, v_yamamoto,
    'ヒアリング済み', 'A', CURRENT_DATE + 14, CURRENT_DATE - 2,
    9, 3600000, 28000000,
    false,
    'ニーズ明確。予算感も合っている。2週間後に正式提案を持参予定。かなり有望。',
    v_yamamoto, now() - interval '8 days', now() - interval '2 days'
  );

  -- ============================================================
  -- 折衝履歴（各社に1〜3件）
  -- ============================================================
  INSERT INTO public.interaction_logs (
    company_id, deal_id, action_date, action_type, content,
    next_action, next_action_date, created_by, created_at, updated_at
  ) VALUES
  -- ミナミ建設（c1）
  (c1, NULL, CURRENT_DATE - 15, '訪問',
   '初回訪問。社長と1時間面談。新築の外壁・屋根工事の外注先を探しているとのこと。年間12棟程度の予定。',
   'ヒアリングシートまとめて再訪', CURRENT_DATE - 7, v_tanaka, now() - interval '15 days', now() - interval '15 days'),
  (c1, NULL, CURRENT_DATE - 7, '提案',
   '概算見積り持参。競合の〇〇工務店と比較検討中と判明。品質・アフター対応で差別化する方針を確認。',
   '条件提示の準備', CURRENT_DATE + 1, v_tanaka, now() - interval '7 days', now() - interval '7 days'),
  (c1, NULL, CURRENT_DATE - 4, '電話',
   '進捗確認。「来週決めたい」との発言あり。明日の打ち合わせで最終判断する模様。',
   NULL, NULL, v_tanaka, now() - interval '4 days', now() - interval '4 days'),

  -- アサヒホーム（c2）- 長期未接触のため古い履歴のみ
  (c2, NULL, CURRENT_DATE - 42, '訪問',
   '前任担当から引き継いで初訪問。担当者は佐々木部長。まずは顔合わせと状況確認。次回ヒアリングを約束。',
   '詳細ヒアリング', CURRENT_DATE - 30, v_tanaka, now() - interval '42 days', now() - interval '42 days'),

  -- フジタ建築（c4）
  (c4, NULL, CURRENT_DATE - 20, '訪問',
   '初回ヒアリング。今期の建築計画15棟分の外部業者選定を進めているとのこと。品質重視の会社方針。',
   '提案書作成', CURRENT_DATE - 10, v_sato, now() - interval '20 days', now() - interval '20 days'),
  (c4, NULL, CURRENT_DATE - 10, '提案',
   '正式提案書と見積り提出。常務に同席いただき好感触。来週の役員会で議題に上がる予定。',
   '役員会後のフォロー', CURRENT_DATE + 6, v_sato, now() - interval '10 days', now() - interval '10 days'),
  (c4, NULL, CURRENT_DATE - 3, '電話',
   '役員会は来週に延期とのこと。打ち合わせ日程を再調整。引き続きフォロー。',
   NULL, NULL, v_sato, now() - interval '3 days', now() - interval '3 days'),

  -- 西田リフォーム（c5）
  (c5, NULL, CURRENT_DATE - 20, '訪問',
   '紹介からの初訪問。リフォーム部門拡大中で協力会社を探している。5棟/月の見込み。',
   '実績資料送付', CURRENT_DATE - 12, v_sato, now() - interval '20 days', now() - interval '20 days'),
  (c5, NULL, CURRENT_DATE - 6, '会議',
   '詳細条件すり合わせ。工期・単価・保証期間について概ね合意。本日最終確認の打ち合わせへ。',
   NULL, NULL, v_sato, now() - interval '6 days', now() - interval '6 days'),

  -- 大和建設（c7）- 長期未接触
  (c7, NULL, CURRENT_DATE - 55, '訪問',
   '大型案件の初回ヒアリング。グループ会社含め年間20棟以上の規模感。決裁は本社購買部。',
   '詳細提案書の作成', CURRENT_DATE - 40, v_yamamoto, now() - interval '55 days', now() - interval '55 days'),
  (c7, NULL, CURRENT_DATE - 35, '提案',
   '詳細提案書を提出。担当者は好感触だったが「本社の承認に時間がかかる」との回答。以降連絡が取れていない。',
   'フォローアップ電話', CURRENT_DATE - 25, v_yamamoto, now() - interval '35 days', now() - interval '35 days'),

  -- 東京ホームズ（c9）
  (c9, NULL, CURRENT_DATE - 8, '訪問',
   '詳細ヒアリング完了。ニーズ・予算・スケジュールすべて把握。2週間後に正式提案を持参することで合意。',
   '提案書作成', CURRENT_DATE + 14, v_yamamoto, now() - interval '8 days', now() - interval '8 days'),
  (c9, NULL, CURRENT_DATE - 2, 'メール',
   '提案書の骨子をメールで共有。「方向性はいい」と返信あり。細部は当日詰める。',
   NULL, NULL, v_yamamoto, now() - interval '2 days', now() - interval '2 days');

  RAISE NOTICE '完了: 田中=% 佐藤=% 山本=%', v_tanaka, v_sato, v_yamamoto;
END $$;
