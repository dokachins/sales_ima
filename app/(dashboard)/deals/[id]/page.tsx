import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('deals').select('company_id').eq('id', id).single()
  redirect(data?.company_id ? `/prospects/${data.company_id}` : '/prospects')
}
