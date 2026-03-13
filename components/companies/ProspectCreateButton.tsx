'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ProspectForm from './ProspectForm'
import type { User } from '@/types'

interface Props {
  users: User[]
  currentUser: User
}

export default function ProspectCreateButton({ users, currentUser }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1">
        <span>+</span> 新規登録
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>見込み先を登録</DialogTitle>
          </DialogHeader>
          <ProspectForm
            users={users}
            currentUser={currentUser}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
