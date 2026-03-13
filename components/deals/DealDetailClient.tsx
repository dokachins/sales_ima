'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ExpectationBadge from './ExpectationBadge'
import DealForm from './DealForm'
import DealMembers from './DealMembers'
import LogList from '@/components/logs/LogList'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { DEAL_STATUS_STYLES } from '@/lib/utils/status'
import type { Deal, InteractionLog, User } from '@/types'
import { toast } from 'sonner'

interface Props {
  deal: Deal
  logs: InteractionLog[]
  users: User[]
  companies: { id: string; company_name: string }[]
  currentUser: User
}

export default function DealDetailClient({ deal: initialDeal, logs: initialLogs, users, companies, currentUser }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deal, setDeal] = useState(initialDeal)
  const [logs, setLogs] = useState(initialLogs)
  const [editOpen, setEditOpen] = useState(false)

  const isAdmin = currentUser.role === 'admin'
  const isOwner = currentUser.id === deal.owner_user_id
  const canEdit = isAdmin || isOwner

  async function refreshDeal() {
    const { data } = await supabase
      .from('deals')
      .select(`
        *,
        company:companies(id, company_name, notes),
        owner:users!deals_owner_user_id_fkey(id, name, email, role, created_at),
        updater:users!deals_updated_by_fkey(id, name, email, role, created_at),
        members:deal_members(user:users(id, name, email, role, created_at))
      `)
      .eq('id', deal.id)
      .single()

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = data as any
      setDeal({ ...raw, members: (raw.members ?? []).map((m: { user: User }) => m.user).filter(Boolean) })
    }
  }

  async function refreshLogs() {
    const { data } = await supabase
      .from('interaction_logs')
      .select(`
        *,
        creator:users!interaction_logs_created_by_fkey(id, name, email, role, created_at),
        updater:users!interaction_logs_updated_by_fkey(id, name, email, role, created_at)
      `)
      .eq('deal_id', deal.id)
      .order('action_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) setLogs(data as InteractionLog[])
    await refreshDeal()
  }

  async function toggleArchive() {
    const newArchived = !deal.is_archived
    const { error } = await supabase
      .from('deals')
      .update({ is_archived: newArchived, updated_by: currentUser.id })
      .eq('id', deal.id)

    if (error) {
      toast.error('更新に失敗しました')
      return
    }
    toast.success(newArchived ? '案件をアーカイブしました' : 'アーカイブを解除しました')
    setDeal((prev) => ({ ...prev, is_archived: newArchived }))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/deals" className="hover:underline">案件一覧</Link>
        <span>/</span>
        <span className="text-gray-900">{deal.deal_name}</span>
      </div>

      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href={`/companies/${deal.company_id}`} className="text-sm text-blue-600 hover:underline">
              {deal.company?.company_name}
            </Link>
            {deal.is_archived && (
              <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                アーカイブ済み
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{deal.deal_name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${DEAL_STATUS_STYLES[deal.status] ?? ''}`}>
              {deal.status}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">期待度</span>
              <ExpectationBadge rank={deal.expectation_rank} />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleArchive}
              className="text-gray-500"
            >
              {deal.is_archived ? 'アーカイブ解除' : 'アーカイブ'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左カラム: 基本情報 + 数字 */}
        <div className="col-span-2 space-y-6">

          {/* 基本情報 */}
          <section className="bg-white rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold text-gray-900">基本情報</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">主担当営業</dt>
                <dd className="font-medium">{deal.owner?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">次回打ち合わせ日</dt>
                <dd className="font-medium">{formatDate(deal.next_meeting_date)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">最終接触日</dt>
                <dd className="font-medium">{formatDate(deal.last_contact_date)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">作成日</dt>
                <dd className="text-gray-600">{formatDate(deal.created_at)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">最終更新</dt>
                <dd className="text-gray-600">
                  {formatDateTime(deal.updated_at)}
                  {deal.updater && ` (${deal.updater.name})`}
                </dd>
              </div>
            </dl>

            <Separator />

            <div>
              <dt className="text-sm text-gray-500 mb-1.5">関係者営業</dt>
              <DealMembers
                dealId={deal.id}
                members={deal.members ?? []}
                allUsers={users}
                ownerId={deal.owner_user_id}
                currentUserId={currentUser.id}
                isAdmin={isAdmin}
                onUpdate={refreshDeal}
              />
            </div>
          </section>

          {/* 数字情報 */}
          <section className="bg-white rounded-lg border p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">数字情報</h2>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">目標売上</dt>
                <dd className="font-medium">
                  {deal.target_sales != null ? `¥${deal.target_sales.toLocaleString()}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">棟数</dt>
                <dd className="font-medium">
                  {deal.building_count != null ? `${deal.building_count}棟` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">見込粗利</dt>
                <dd className="font-medium">
                  {deal.expected_gross_profit != null
                    ? `¥${deal.expected_gross_profit.toLocaleString()}`
                    : '—'}
                </dd>
              </div>
            </dl>
          </section>

          {/* 競合情報 */}
          {(deal.competitor_name || deal.competitor_memo) && (
            <section className="bg-white rounded-lg border p-4 space-y-3">
              <h2 className="font-semibold text-gray-900">競合情報</h2>
              <dl className="text-sm space-y-2">
                {deal.competitor_name && (
                  <div>
                    <dt className="text-gray-500">競合会社</dt>
                    <dd className="font-medium">{deal.competitor_name}</dd>
                  </div>
                )}
                {deal.competitor_memo && (
                  <div>
                    <dt className="text-gray-500">競合状況</dt>
                    <dd className="text-gray-700 whitespace-pre-wrap">{deal.competitor_memo}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* 備考 */}
          {deal.notes && (
            <section className="bg-white rounded-lg border p-4">
              <h2 className="font-semibold text-gray-900 mb-2">備考</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
            </section>
          )}

          {/* 折衝履歴 */}
          <section className="bg-white rounded-lg border p-4">
            <LogList
              companyId={deal.company_id}
              logs={logs}
              currentUser={currentUser}
              companyOwnerId={deal.owner_user_id}
              isAdmin={isAdmin}
              onUpdate={refreshLogs}
            />
          </section>
        </div>

        {/* 右カラム: クイック情報 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-gray-900">案件サマリー</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">ステータス</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${DEAL_STATUS_STYLES[deal.status] ?? ''}`}>
                  {deal.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">期待度</span>
                <ExpectationBadge rank={deal.expectation_rank} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">折衝回数</span>
                <span className="font-medium">{logs.length}回</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>案件を編集</DialogTitle>
          </DialogHeader>
          <DealForm
            deal={deal}
            companies={companies as { id: string; company_name: string }[] as Parameters<typeof DealForm>[0]['companies']}
            users={users}
            currentUser={currentUser}
            onSuccess={(updated) => {
              setDeal((prev) => ({ ...prev, ...updated }))
              setEditOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
