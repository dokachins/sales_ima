'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DealForm from './DealForm'
import type { Company, User } from '@/types'

interface Props {
  users: User[]
  currentUser: User
  companies?: Company[]
  companyId?: string  // 会社詳細ページから作成する場合
}

export default function DealCreateButton({ users, currentUser, companies = [], companyId }: Props) {
  const [open, setOpen] = useState(false)

  // companyIdが指定されている場合、その会社に対してフォームを開く
  const initialCompanies = companies

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        + 新規案件
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新規案件を作成</DialogTitle>
          </DialogHeader>
          <DealForm
            companies={initialCompanies}
            users={users}
            currentUser={currentUser}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
