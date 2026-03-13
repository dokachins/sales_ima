# Scout - 営業支援アプリ エージェント向けガイド

## プロジェクト概要
新規顧客開拓向け営業支援WebアプリのMVP。
見込み先（Company）を中心に折衝履歴・期待度・担当者を管理する。

## 技術スタック
- **Framework**: Next.js 16 (App Router, Turbopack)
- **DB / Auth**: Supabase (PostgreSQL + RLS)
- **UI**: shadcn/ui v4 (`@base-ui/react` ベース — Radix UI **ではない**)
- **Style**: Tailwind CSS v4
- **Language**: TypeScript strict

## 重要な制約・注意点

### shadcn/ui v4 (@base-ui/react)
- `Select.onValueChange` のコールバックは `(value: string | null) => void` → `v ?? ''` で null を処理すること
- `DropdownMenuTrigger` は `asChild` prop **非対応**
- ミドルウェアは `proxy.ts`（`middleware.ts` ではない）

### Supabase
- クエリ結果の JOIN データは `any` キャストして処理する
- `company_members(user:users(...))` は `{ user: User }[]` として返る
- RLS: 全員が閲覧可能、編集は主担当・関係者・管理者のみ

### ビルド
```bash
node node_modules/next/dist/bin/next dev    # 開発
node node_modules/next/dist/bin/next build  # ビルド
node node_modules/typescript/lib/tsc.js --noEmit  # 型チェック
```

## ディレクトリ構成
```
app/
  (auth)/login/           # ログイン
  (dashboard)/            # 認証済み画面
    page.tsx              # ホーム（ウィジェット）
    prospects/            # 見込み先一覧・詳細・サブページ
    companies/            # 会社（旧）
    deals/                # 案件（フェーズ2用）
  auth/callback/          # Supabase Auth コールバック
proxy.ts                  # 認証ミドルウェア
lib/
  supabase/client.ts      # クライアント
  supabase/server.ts      # サーバー
  utils/date.ts           # formatDate, daysSince
  utils/number.ts         # formatYen, formatManYen
  utils/expectation.ts    # EXPECTATION_COLORS, getExpectationColor
  utils/status.ts         # PROSPECT_STATUS_STYLES, DEAL_STATUS_STYLES
types/index.ts            # 全型定義・定数
components/
  companies/              # 見込み先コンポーネント
  deals/                  # ExpectationBadge など
  home/                   # HomeWidgets
  layout/                 # Header
  logs/                   # LogList, LogForm
  ui/                     # shadcn/ui コンポーネント
supabase/migrations/      # 001〜009
```

## 主要な型
```typescript
// 主役エンティティ
interface Company {
  id, company_name, owner_user_id, status: ProspectStatus,
  expectation_rank: ExpectationRank | null,  // A|B|C|D|E
  next_meeting_date, last_contact_date, building_count,
  expected_gross_profit, target_sales, is_important,
  notes, competitor_name, competitor_memo,
  owner?: User, members?: User[]
}

// ステータス定数
CLOSED_STATUSES = ['受注', '失注', '保留']
ACTIVE_STATUSES = ['未接触', '接触中', 'ヒアリング済み', '提案中', '商談中']
NEGLECT_THRESHOLD_DAYS = 30
```

## コーディング規則
- コンポーネントは `'use client'` / server component を明示的に使い分ける
- Supabase サーバー操作は `app/` の Server Component で行い、Client Component には結果を props で渡す
- スタイルは Tailwind ユーティリティのみ（CSS modules 不使用）
- カスタムクラス: `section-card`（白カード）、`field-label`（ラベル）
- 新しいページは既存の `/prospects/important-neglected/page.tsx` を参考に作ること
- DB マイグレーションは `supabase/migrations/` に連番で追加

## ロール分担
- **設計・UIデザイン**: Claude Code
- **実装**: Codex（このファイルを読んで実装すること）
- **レビュー**: Codex + Claude Code の二重チェック
