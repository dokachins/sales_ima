'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import LogModal from './LogModal'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import type { InteractionLog, User } from '@/types'
import { toast } from 'sonner'

interface Props {
  companyId: string
  logs: InteractionLog[]
  currentUser: User
  companyOwnerId: string
  isAdmin: boolean
  onUpdate: () => void
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  '訪問':   'bg-green-100 text-green-700',
  '電話':   'bg-blue-100 text-blue-700',
  'メール':  'bg-purple-100 text-purple-700',
  '会議':   'bg-orange-100 text-orange-700',
  '提案':   'bg-red-100 text-red-700',
  'その他':  'bg-gray-100 text-gray-600',
}

export default function LogList({
  companyId, logs, currentUser, companyOwnerId, isAdmin, onUpdate
}: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editLog, setEditLog] = useState<InteractionLog | null>(null)
  const supabase = createClient()

  async function deleteLog(logId: string) {
    if (!confirm('この折衝履歴を削除しますか？')) return
    const { error } = await supabase.from('interaction_logs').delete().eq('id', logId)
    if (error) {
      toast.error('削除に失敗しました')
      return
    }
    toast.success('削除しました')
    onUpdate()
  }

  function canEditLog(log: InteractionLog) {
    return isAdmin || log.created_by === currentUser.id
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">折衝履歴</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          + 記録を追加
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400 mb-3">折衝履歴はまだありません</p>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            最初の記録を追加する
          </Button>
        </div>
      ) : (
        <div className="space-y-0">
          {logs.map((log, i) => (
            <div key={log.id}>
              <div className="flex gap-3 py-4">
                {/* タイムライン */}
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                  {i < logs.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(log.action_date)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_TYPE_COLORS[log.action_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action_type}
                    </span>
                    <span className="text-xs text-gray-400">{log.creator?.name}</span>
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.content}</p>

                  {log.next_action && (
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                      <span className="font-medium">次回アクション:</span> {log.next_action}
                      {log.next_action_date && (
                        <span className="ml-2 text-gray-400">（{formatDate(log.next_action_date)}）</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {log.updated_at !== log.created_at && (
                      <span className="text-xs text-gray-400">
                        編集済み {formatDateTime(log.updated_at)}
                        {log.updater && ` (${log.updater.name})`}
                      </span>
                    )}
                    {canEditLog(log) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditLog(log)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {i < logs.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}

      {/* 追加モーダル */}
      <LogModal
        open={addOpen}
        onOpenChange={setAddOpen}
        companyId={companyId}
        currentUser={currentUser}
        onSuccess={onUpdate}
      />

      {/* 編集モーダル */}
      {editLog && (
        <LogModal
          open={!!editLog}
          onOpenChange={(v) => { if (!v) setEditLog(null) }}
          companyId={companyId}
          currentUser={currentUser}
          log={editLog}
          onSuccess={() => { setEditLog(null); onUpdate() }}
        />
      )}
    </div>
  )
}
