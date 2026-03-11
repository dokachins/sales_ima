-- ============================================================
-- IMA Sales MVP - Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (auth.users と同期するプロフィールテーブル)
-- ============================================================
CREATE TABLE public.users (
  id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name   text NOT NULL,
  email  text UNIQUE NOT NULL,
  role   text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE public.companies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name          text NOT NULL,
  main_contact_user_id  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DEALS
-- ============================================================
CREATE TABLE public.deals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deal_name             text NOT NULL,
  owner_user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status                text NOT NULL DEFAULT '未着手'
                          CHECK (status IN ('未着手','接触中','ヒアリング済み','提案中','商談中','受注','失注','保留')),
  expectation_rank      text CHECK (expectation_rank IN ('A','B','C','D','E')),
  target_sales          numeric,
  building_count        integer,
  expected_gross_profit numeric,
  competitor_name       text,
  competitor_memo       text,
  next_meeting_date     date,          -- 手動管理。次回打ち合わせが確定したら更新
  notes                 text,
  is_archived           boolean NOT NULL DEFAULT false,
  last_contact_date     date,          -- 放置案件判定用。折衝履歴の最新action_dateを自動反映
  updated_by            uuid REFERENCES public.users(id) ON DELETE SET NULL, -- 最終更新者（最近更新した案件用）
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DEAL MEMBERS (関係者営業)
-- ============================================================
CREATE TABLE public.deal_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, user_id)
);

-- ============================================================
-- INTERACTION LOGS (折衝履歴)
-- ============================================================
CREATE TABLE public.interaction_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id          uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  action_date      date NOT NULL,
  action_type      text NOT NULL
                     CHECK (action_type IN ('訪問','電話','メール','会議','提案','その他')),
  content          text NOT NULL,
  next_action      text,
  next_action_date date,           -- 折衝履歴上の次回アクション日（deals.next_meeting_dateとは独立）
  created_by       uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_deals_company_id       ON public.deals(company_id);
CREATE INDEX idx_deals_owner_user_id    ON public.deals(owner_user_id);
CREATE INDEX idx_deals_status           ON public.deals(status);
CREATE INDEX idx_deals_expectation_rank ON public.deals(expectation_rank);
CREATE INDEX idx_deals_last_contact     ON public.deals(last_contact_date);
CREATE INDEX idx_deals_next_meeting     ON public.deals(next_meeting_date);
CREATE INDEX idx_deal_members_deal_id   ON public.deal_members(deal_id);
CREATE INDEX idx_deal_members_user_id   ON public.deal_members(user_id);
CREATE INDEX idx_logs_deal_id           ON public.interaction_logs(deal_id);
CREATE INDEX idx_logs_action_date       ON public.interaction_logs(action_date);
CREATE INDEX idx_logs_created_by        ON public.interaction_logs(created_by);
