import { format, formatDistanceToNow, differenceInDays, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  const d = parseISO(date)
  if (!isValid(d)) return '—'
  return format(d, 'yyyy/MM/dd', { locale: ja })
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  const d = parseISO(date)
  if (!isValid(d)) return '—'
  return format(d, 'yyyy/MM/dd HH:mm', { locale: ja })
}

export function fromNow(date: string | null | undefined): string {
  if (!date) return '—'
  const d = parseISO(date)
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: ja })
}

export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null
  const d = parseISO(date)
  if (!isValid(d)) return null
  return differenceInDays(new Date(), d)
}

export function isNeglected(lastContactDate: string | null | undefined, thresholdDays = 30): boolean {
  if (!lastContactDate) return true
  const days = daysSince(lastContactDate)
  if (days === null) return true
  return days >= thresholdDays
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** サーバー/クライアント共通のJST日付文字列（YYYY-MM-DD）を返す */
export function jstDateStr(offsetDays = 0): string {
  const ms = Date.now() + offsetDays * 86400000
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })
}
