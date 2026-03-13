// ============================================================
// IMA Sales MVP - 共通型定義
// 見込み先（Company）中心の設計
// ============================================================

export type UserRole = 'admin' | 'member'

// 見込み先のステータス（旧 DealStatus と統合）
export type ProspectStatus =
  | '未接触'
  | '接触中'
  | 'ヒアリング済み'
  | '提案中'
  | '商談中'
  | '受注'
  | '失注'
  | '保留'

// 後方互換のエイリアス
export type DealStatus = ProspectStatus

export type ExpectationRank = 'A' | 'B' | 'C' | 'D' | 'E'

export type ActionType = '訪問' | '電話' | 'メール' | '会議' | '提案' | 'その他'

// ============================================================
// DB エンティティ型
// ============================================================

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

// 見込み先（旧 Company）- 主役エンティティ
export interface Company {
  id: string
  company_name: string
  // 旧フィールド（後方互換）
  main_contact_user_id: string | null
  // 新フィールド（見込み先管理）
  owner_user_id: string | null
  status: ProspectStatus
  expectation_rank: ExpectationRank | null
  next_meeting_date: string | null
  competitor_name: string | null
  competitor_memo: string | null
  target_sales: number | null
  expected_gross_profit: number | null
  building_count: number | null
  last_contact_date: string | null
  updated_by: string | null
  is_important: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // JOINで取得
  owner?: User | null
  main_contact?: User | null
  updater?: User | null
  members?: User[]
}

export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  created_at: string
  user?: User
}

// 折衝履歴（company_id 対応）
export interface InteractionLog {
  id: string
  company_id: string | null
  deal_id: string | null
  action_date: string
  action_type: ActionType
  content: string
  next_action: string | null
  next_action_date: string | null
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  creator?: User | null
  updater?: User | null
}

// 後方互換のため Deal 型を保持（今後フェーズ2で活用）
export interface Deal {
  id: string
  company_id: string
  deal_name: string
  owner_user_id: string
  status: DealStatus
  expectation_rank: ExpectationRank | null
  target_sales: number | null
  building_count: number | null
  expected_gross_profit: number | null
  competitor_name: string | null
  competitor_memo: string | null
  next_meeting_date: string | null
  notes: string | null
  is_archived: boolean
  last_contact_date: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  company?: Company | null
  owner?: User | null
  updater?: User | null
  members?: User[]
}

// ============================================================
// フォーム入力型
// ============================================================

export interface ProspectFormInput {
  company_name: string
  owner_user_id: string | null
  status: ProspectStatus
  expectation_rank: ExpectationRank | null
  next_meeting_date: string | null
  competitor_name: string | null
  competitor_memo: string | null
  target_sales: number | null
  expected_gross_profit: number | null
  building_count: number | null
  notes: string | null
  is_important: boolean
}

// 後方互換
export type CompanyFormInput = ProspectFormInput

export interface InteractionLogFormInput {
  action_date: string
  action_type: ActionType
  content: string
  next_action: string | null
  next_action_date: string | null
}

// ============================================================
// フィルター型
// ============================================================

export interface ProspectFilters {
  owner_user_id?: string
  status?: ProspectStatus | ''
  expectation_rank?: ExpectationRank | ''
  show_closed?: boolean   // 受注/失注/保留を表示するか
  show_archived?: boolean // 後方互換
  is_important?: boolean
  search?: string
  next_meeting_from?: string
  next_meeting_to?: string
}

export type ProspectSortKey = 'next_meeting_date' | 'updated_at' | 'expected_gross_profit' | 'expectation_rank' | 'last_contact_date'
export type SortOrder = 'asc' | 'desc'

// 後方互換
export type DealFilters = ProspectFilters
export type DealSortKey = ProspectSortKey

export interface DealFormInput {
  company_id: string
  deal_name: string
  owner_user_id: string
  status: DealStatus
  expectation_rank: ExpectationRank | null
  target_sales: number | null
  building_count: number | null
  expected_gross_profit: number | null
  competitor_name: string | null
  competitor_memo: string | null
  next_meeting_date: string | null
  notes: string | null
  is_archived: boolean
}

// ============================================================
// 定数
// ============================================================

export const PROSPECT_STATUSES: ProspectStatus[] = [
  '未接触', '接触中', 'ヒアリング済み', '提案中', '商談中', '受注', '失注', '保留',
]

export const CLOSED_STATUSES: ProspectStatus[] = ['受注', '失注', '保留']

export const ACTIVE_STATUSES: ProspectStatus[] = ['未接触', '接触中', 'ヒアリング済み', '提案中', '商談中']

export const EXPECTATION_RANKS: ExpectationRank[] = ['A', 'B', 'C', 'D', 'E']

export const ACTION_TYPES: ActionType[] = ['訪問', '電話', 'メール', '会議', '提案', 'その他']

export const NEGLECT_THRESHOLD_DAYS = 30
export const HIGH_EXPECTATION_RANKS: ExpectationRank[] = ['A', 'B']
export const UPCOMING_DAYS = 7

// 後方互換
export const DEAL_STATUSES = PROSPECT_STATUSES
export const ARCHIVED_STATUSES = CLOSED_STATUSES
