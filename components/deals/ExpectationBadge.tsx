import { getExpectationColor } from '@/lib/utils/expectation'
import type { ExpectationRank } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  rank: ExpectationRank | null | undefined
  size?: 'sm' | 'md'
}

export default function ExpectationBadge({ rank, size = 'md' }: Props) {
  const color = getExpectationColor(rank)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold border',
        color.bg, color.text, color.border,
        size === 'sm' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'
      )}
    >
      {rank ?? '—'}
    </span>
  )
}
