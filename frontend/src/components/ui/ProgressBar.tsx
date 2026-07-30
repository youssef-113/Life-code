import { motion } from 'framer-motion'
import type { CompletionLevel } from '@/types'
import { completionColor } from '@/lib/format'

export function ProgressBar({
  value,
  level,
  height = 8,
}: {
  value: number
  level: CompletionLevel
  height?: number
}) {
  const color = completionColor(level)
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 999,
        background: 'rgba(148,178,216,0.12)',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          height: '100%',
          borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, var(--brand-blue))`,
        }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  level,
  size = 96,
  strokeWidth = 9,
}: {
  value: number
  level: CompletionLevel
  size?: number
  strokeWidth?: number
}) {
  const color = completionColor(level)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,178,216,0.12)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.22, fontWeight: 600 }}>
          {value}%
        </span>
      </div>
    </div>
  )
}
