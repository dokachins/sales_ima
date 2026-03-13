import { createClient } from '@/lib/supabase/client'
import type { InteractionLog, InteractionLogFormInput } from '@/types'

const LOG_SELECT = `
  *,
  creator:users!interaction_logs_created_by_fkey(id, name, email, role, created_at),
  updater:users!interaction_logs_updated_by_fkey(id, name, email, role, created_at)
`

export async function getLogsByCompany(companyId: string): Promise<InteractionLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interaction_logs')
    .select(LOG_SELECT)
    .eq('company_id', companyId)
    .order('action_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as InteractionLog[]
}

export async function createLog(
  companyId: string,
  input: InteractionLogFormInput,
  userId: string
): Promise<InteractionLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interaction_logs')
    .insert({
      company_id: companyId,
      deal_id: null,
      ...input,
      created_by: userId,
    })
    .select(LOG_SELECT)
    .single()

  if (error) throw error
  return data as InteractionLog
}

export async function updateLog(
  id: string,
  input: Partial<InteractionLogFormInput>,
  userId: string
): Promise<InteractionLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('interaction_logs')
    .update({
      ...input,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(LOG_SELECT)
    .single()

  if (error) throw error
  return data as InteractionLog
}

export async function deleteLog(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('interaction_logs')
    .delete()
    .eq('id', id)

  if (error) throw error
}
