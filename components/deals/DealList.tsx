'use client'

import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ExpectationBadge from './ExpectationBadge'
import { formatDate } from '@/lib/utils/date'
import { DEAL_STATUS_STYLES } from '@/lib/utils/status'
import type { Deal } from '@/types'

interface Props {
  deals: Deal[]
}

export default function DealList({ deals }: Props) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-sm">該当する案件がありません</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-40">会社名</TableHead>
            <TableHead>案件名</TableHead>
            <TableHead className="w-24">主担当</TableHead>
            <TableHead className="w-28">ステータス</TableHead>
            <TableHead className="w-16 text-center">期待度</TableHead>
            <TableHead className="w-28">次回予定</TableHead>
            <TableHead className="w-28">最終接触</TableHead>
            <TableHead className="w-28 text-right">見込粗利</TableHead>
            <TableHead className="w-28">最終更新</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id} className="hover:bg-gray-50 cursor-pointer">
              <TableCell className="font-medium">
                <Link href={`/companies/${deal.company_id}`} className="hover:underline text-gray-700">
                  {deal.company?.company_name ?? '—'}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/deals/${deal.id}`} className="hover:underline font-medium">
                  {deal.deal_name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {deal.owner?.name ?? '—'}
              </TableCell>
              <TableCell>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${DEAL_STATUS_STYLES[deal.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {deal.status}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <ExpectationBadge rank={deal.expectation_rank} size="sm" />
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(deal.next_meeting_date)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(deal.last_contact_date)}
              </TableCell>
              <TableCell className="text-right text-sm text-gray-600">
                {deal.expected_gross_profit != null
                  ? `${(deal.expected_gross_profit / 10000).toLocaleString()}万`
                  : '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-400">
                {formatDate(deal.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
