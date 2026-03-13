'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import ExpectationBadge from '@/components/deals/ExpectationBadge'
import ProspectForm from './ProspectForm'
import ProspectMembers from './ProspectMembers'
import LogList from '@/components/logs/LogList'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { formatYen } from '@/lib/utils/number'
import { PROSPECT_STATUS_STYLES } from '@/lib/utils/status'
import type { Company, InteractionLog, User } from '@/types'
import { toast } from 'sonner'

interface Props {
  prospect: Company
  logs: InteractionLog[]
  users: User[]
  currentUser: User
}

export default function ProspectDetailClient({ prospect: init, logs: initLogs, users, currentUser }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [prospect, setProspect] = useState(init)
  const [logs, setLogs] = useState(initLogs)
  const [editOpen, setEditOpen] = useState(false)

  const isAdmin = currentUser.role === 'admin'
  const isOwner = currentUser.id === prospect.owner_user_id
  const isMember = (prospect.members ?? []).some((m) => m.id === currentUser.id)
  const canEdit = isAdmin || isOwner || isMember

  async function refresh() {
    const { data } = await supabase.from('companies').select(`
      *,
      owner:users!companies_owner_user_id_fkey(id, name, email, role, created_at),
      updater:users!companies_updated_by_fkey(id, name, email, role, created_at),
      members:company_members(user:users(id, name, email, role, created_at))
    `).eq('id', prospect.id).single()
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = data as any
      setProspect({ ...raw, members: (raw.members ?? []).map((m: { user: User }) => m.user).filter(Boolean) })
    }
  }

  async function refreshLogs() {
    const { data } = await supabase.from('interaction_logs').select(`
      *,
      creator:users!interaction_logs_created_by_fkey(id, name, email, role, created_at),
      updater:users!interaction_logs_updated_by_fkey(id, name, email, role, created_at)
    `).eq('company_id', prospect.id)
      .order('action_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setLogs(data as InteractionLog[])
    await refresh()
  }

  async function handleDelete() {
    if (!confirm(`「${prospect.company_name}」を削除しますか？\n折衝履歴も含めて完全に削除されます。この操作は取り消せません。`)) return
    const { error } = await supabase.from('companies').delete().eq('id', prospect.id)
    if (error) { toast.error('削除に失敗しました'); return }
    toast.success('削除しました')
    router.push('/prospects')
  }

  async function toggleImportant() {
    const { error } = await supabase
      .from('companies')
      .update({ is_important: !prospect.is_important })
      .eq('id', prospect.id)
    if (error) { toast.error('更新に失敗しました'); return }
    setProspect((p) => ({ ...p, is_important: !p.is_important }))
  }

  return (
    <div className="space-y-4">
      {/* パンくず */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/prospects" className="hover:text-gray-600 transition-colors">見込み先一覧</Link>
        <span>/</span>
        <span className="text-gray-700">{prospect.company_name}</span>
      </div>

      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PROSPECT_STATUS_STYLES[prospect.status] ?? ''}`}>
              {prospect.status}
            </span>
            {prospect.is_important && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                ★ 重要
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{prospect.company_name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>主担当: <span className="text-gray-800 font-medium">{prospect.owner?.name ?? '未設定'}</span></span>
            {prospect.expectation_rank && (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  期待度 <ExpectationBadge rank={prospect.expectation_rank} size="sm" />
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleImportant}
            className={`text-xl leading-none transition-colors ${prospect.is_important ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
            title={prospect.is_important ? '重要解除' : '重要にする'}
          >
            ★
          </button>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              編集
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:border-red-300">
              削除
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* メインコンテンツ */}
        <div className="col-span-2 space-y-3">

          {/* 基本情報 */}
          <section className="section-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">基本情報</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">次回打ち合わせ日</dt>
                <dd className="font-medium text-gray-900">
                  {prospect.next_meeting_date
                    ? <span className="text-blue-600">{formatDate(prospect.next_meeting_date)}</span>
                    : '—'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">最終接触日</dt>
                <dd className="font-medium text-gray-900">{formatDate(prospect.last_contact_date)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">作成日</dt>
                <dd className="text-gray-600">{formatDate(prospect.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 mb-0.5">最終更新</dt>
                <dd className="text-gray-600 text-xs">
                  {formatDateTime(prospect.updated_at)}
                  {prospect.updater && <span className="text-gray-400"> ({prospect.updater.name})</span>}
                </dd>
              </div>
            </dl>

            {(prospect.members?.length ?? 0) > 0 || canEdit ? (
              <>
                <Separator />
                <div>
                  <dt className="text-xs text-gray-400 mb-2">関係者営業</dt>
                  <ProspectMembers
                    companyId={prospect.id}
                    members={prospect.members ?? []}
                    allUsers={users}
                    ownerId={prospect.owner_user_id ?? ''}
                    currentUserId={currentUser.id}
                    isAdmin={isAdmin}
                    onUpdate={refresh}
                  />
                </div>
              </>
            ) : null}
          </section>

          {/* 数字情報 */}
          {(prospect.target_sales != null || prospect.expected_gross_profit != null) && (
            <section className="section-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">数字情報</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">目標売上</dt>
                  <dd className="font-medium text-gray-900">{formatYen(prospect.target_sales)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">見込粗利</dt>
                  <dd className="font-medium text-gray-900">{formatYen(prospect.expected_gross_profit)}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* 競合情報 */}
          {(prospect.competitor_name || prospect.competitor_memo) && (
            <section className="section-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">競合情報</h2>
              <dl className="text-sm space-y-2">
                {prospect.competitor_name && (
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">競合会社</dt>
                    <dd className="font-medium text-gray-900">{prospect.competitor_name}</dd>
                  </div>
                )}
                {prospect.competitor_memo && (
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">競合状況</dt>
                    <dd className="text-gray-700 whitespace-pre-wrap">{prospect.competitor_memo}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* 備考 */}
          {prospect.notes && (
            <section className="section-card p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">備考</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{prospect.notes}</p>
            </section>
          )}

          {/* 折衝履歴 */}
          <section className="section-card p-5">
            <LogList
              companyId={prospect.id}
              logs={logs}
              currentUser={currentUser}
              companyOwnerId={prospect.owner_user_id ?? ''}
              isAdmin={isAdmin}
              onUpdate={refreshLogs}
            />
          </section>
        </div>

        {/* サイドバー */}
        <div className="space-y-3">
          <div className="section-card p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">サマリー</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">ステータス</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PROSPECT_STATUS_STYLES[prospect.status] ?? ''}`}>
                  {prospect.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">期待度</span>
                <ExpectationBadge rank={prospect.expectation_rank} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">接触回数</span>
                <span className="font-medium text-gray-900">{logs.length}回</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>見込み先を編集</DialogTitle>
          </DialogHeader>
          <ProspectForm
            prospect={prospect}
            users={users}
            currentUser={currentUser}
            onSuccess={async () => {
              setEditOpen(false)
              await refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
