import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  raised?: boolean
  padding?: number | string
}

export function Card({ children, raised, padding = 22, style, ...rest }: CardProps) {
  return (
    <div
      style={{
        background: raised ? 'var(--bg-panel-raised)' : 'var(--bg-panel)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 18,
        gap: 12,
      }}
    >
      <div>
        <h3 style={{ fontSize: 16.5, fontWeight: 600 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
