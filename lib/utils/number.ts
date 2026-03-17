/** 数値を日本語カンマ区切りで表示 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('ja-JP')
}

/** 円単位でフォーマット（例: 1,500,000円） */
export function formatYen(value: number | null | undefined): string {
  if (value == null) return '—'
  return `¥${value.toLocaleString('ja-JP')}`
}

/** 万円単位でフォーマット（例: 150万円） */
export function formatManYen(value: number | null | undefined): string {
  if (value == null) return '—'
  const man = value / 10000
  if (Number.isInteger(man)) return `${man.toLocaleString('ja-JP')}万円`
  return `${man.toFixed(1)}万円`
}

/** フォーム用: カンマ区切り文字列 → 数値（全角数字も自動変換） */
export function parseFormattedNumber(str: string): number | null {
  const cleaned = str
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，]/g, '')
    .trim()
  if (cleaned === '') return null
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

/** フォーム用: 数値 → カンマ区切り文字列 */
export function toFormattedString(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('ja-JP')
}
