'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import CompanyForm from './CompanyForm'
import DealList from '@/components/deals/DealList'
import DealCreateButton from '@/components/deals/DealCreateButton'
import { formatDate } from '@/lib/utils/date'
import type { Company, Deal, User } from '@/types'

interface Props {
  company: Company
  deals: Deal[]
  users: User[]
  currentUser: User
}

export default function CompanyDetailClient({ company: initialCompany, deals, users, currentUser }: Props) {
  const [company, setCompany] = useState(initialCompany)
  const [editOpen, setEditOpen] = useState(false)

  const activeDeals = deals.filter((d) => !d.is_archived && !['受注', '失注', '保留'].includes(d.status))
  const pastDeals = deals.filter((d) => d.is_archived || ['受注', '失注', '保留'].includes(d.status))
  const [showPast, setShowPast] = useState(false)

  // 会社の companies 型に合わせる
  const companiesForForm: Parameters<typeof DealCreateButton>[0]['companies'] = [
    { id: company.id, company_name: company.company_name }
  ] as Parameters<typeof DealCreateButton>[0]['companies']

  return (
    <div className="space-y-6 max-w-5xl">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/companies" className="hover:underline">会社一覧</Link>
        <span>/</span>
        <span className="text-gray-900">{company.company_name}</span>
      </div>

      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            主担当: {company.main_contact?.name ?? '未設定'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          会社情報を編集
        </Button>
      </div>

      {/* 会社情報 */}
      <div className="bg-white rounded-lg border p-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">主担当営業</dt>
          <dd className="font-medium">{company.main_contact?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">進行中案件数</dt>
          <dd className="font-medium text-blue-600">{activeDeals.length}件</dd>
        </div>
        <div>
          <dt className="text-gray-500">最終更新日</dt>
          <dd className="text-gray-600">{formatDate(company.updated_at)}</dd>
        </div>
        {company.notes && (
          <div className="col-span-3">
            <dt className="text-gray-500">備考</dt>
            <dd className="text-gray-700 whitespace-pre-wrap">{company.notes}</dd>
          </div>
        )}
      </div>

      {/* 進行中案件 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">進行中案件 ({activeDeals.length})</h2>
          <DealCreateButton
            users={users}
            currentUser={currentUser}
            companies={companiesForForm}
            companyId={company.id}
          />
        </div>
        <DealList deals={activeDeals} />
      </section>

      {/* 過去案件 */}
      {pastDeals.length > 0 && (
        <section className="space-y-3">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showPast ? '▲' : '▶'} 過去案件（受注/失注/保留）{pastDeals.length}件
          </button>
          {showPast && <DealList deals={pastDeals} />}
        </section>
      )}

      {/* 会社編集ダイアログ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>会社情報を編集</DialogTitle>
          </DialogHeader>
          <CompanyForm
            company={company}
            users={users}
            currentUser={currentUser}
            onSuccess={(updated) => {
              setCompany((prev) => ({ ...prev, ...updated }))
              setEditOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
