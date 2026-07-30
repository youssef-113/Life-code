import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {icon && (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'var(--signal-cyan-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--signal-cyan)',
            marginBottom: 6,
          }}
        >
          {icon}
        </div>
      )}
      <h4 style={{ fontSize: 15 }}>{title}</h4>
      {description && (
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 340 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

export function PageLoader({ label = 'Loading vitals…' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '80px 20px',
        color: 'var(--text-secondary)',
      }}
    >
      <svg width="140" height="46" viewBox="0 0 140 46" fill="none">
        <path
          className="pulse-path"
          d="M0 23h28l7-16 10 34 8-24 5 6h20l7-16 10 34 8-24 5 6h32"
          stroke="var(--signal-cyan)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{label}</span>
    </div>
  )
}
