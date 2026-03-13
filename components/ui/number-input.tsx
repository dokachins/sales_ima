'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { parseFormattedNumber, toFormattedString } from '@/lib/utils/number'
import { cn } from '@/lib/utils'

interface Props {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  suffix?: string
  className?: string
  id?: string
}

export function NumberInput({ value, onChange, placeholder, suffix, className, id }: Props) {
  const [displayValue, setDisplayValue] = useState(toFormattedString(value))
  const [focused, setFocused] = useState(false)

  function handleFocus() {
    setFocused(true)
    // フォーカス時はカンマなしの生数値を表示
    setDisplayValue(value != null ? String(value) : '')
  }

  function handleBlur() {
    setFocused(false)
    const parsed = parseFormattedNumber(displayValue)
    onChange(parsed)
    setDisplayValue(toFormattedString(parsed))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplayValue(e.target.value)
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn('pr-10', suffix && 'pr-12')}
      />
      {suffix && (
        <span className="absolute right-3 text-sm text-gray-400 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  )
}
