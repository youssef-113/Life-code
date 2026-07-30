import type { ReactNode } from 'react'

type Tone = 'cyan' | 'green' | 'amber' | 'red' | 'neutral'

const TONE_COLORS: Record<Tone, { bg: string; fg: string; border: string }> = {
  cyan: { bg: 'var(--signal-cyan-dim)', fg: 'var(--signal-cyan)', border: 'rgba(34,211,238,0.35)' },
  green: { bg: 'var(--vital-green-dim)', fg: 'var(--vital-green)', border: 'rgba(52,211,153,0.35)' },
  amber: { bg: 'var(--warning-amber-dim)', fg: 'var(--warning-amber)', border: 'rgba(251,191,36,0.35)' },
  red: { bg: 'var(--critical-red-dim)', fg: 'var(--critical-red)', border: 'rgba(251,75,75,0.35)' },
  neutral: { bg: 'rgba(148,178,216,0.1)', fg: 'var(--text-secondary)', border: 'var(--border-hairline-strong)' },
}

export function Badge({
  children,
  tone = 'neutral',
  icon,
  mono,
}: {
  children: ReactNode
  tone?: Tone
  icon?: ReactNode
  mono?: boolean
}) {
  const c = TONE_COLORS[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </span>
  )
}
