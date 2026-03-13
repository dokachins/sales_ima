import type { ExpectationRank } from '@/types'

export const EXPECTATION_COLORS: Record<ExpectationRank, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  B: { bg: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-300' },
  C: { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300' },
  D: { bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-300' },
  E: { bg: 'bg-gray-100',    text: 'text-gray-400',    border: 'border-gray-200' },
}

export function getExpectationColor(rank: ExpectationRank | null | undefined) {
  if (!rank) return { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' }
  return EXPECTATION_COLORS[rank]
}
