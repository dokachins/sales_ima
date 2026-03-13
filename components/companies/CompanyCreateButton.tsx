'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CompanyForm from './CompanyForm'
import type { User } from '@/types'

interface Props {
  users: User[]
  currentUser: User
}

export default function CompanyCreateButton({ users, currentUser }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        + 新規会社登録
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新規会社を登録</DialogTitle>
          </DialogHeader>
          <CompanyForm
            users={users}
            currentUser={currentUser}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
