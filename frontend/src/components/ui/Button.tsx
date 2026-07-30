import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'critical'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--signal-cyan), var(--brand-blue))',
    color: '#04121c',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--bg-panel-raised)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-hairline-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'transparent',
    color: 'var(--critical-red)',
    border: '1px solid rgba(251, 75, 75, 0.4)',
  },
  critical: {
    background: 'linear-gradient(135deg, #fb4b4b, #d92b2b)',
    color: '#fff',
    border: '1px solid transparent',
  },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 13, borderRadius: 8 },
  md: { padding: '10px 18px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '13px 24px', fontSize: 15, borderRadius: 12 },
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, disabled, children, style, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          ...VARIANT_STYLES[variant],
          ...SIZE_STYLES[size],
          fontWeight: 600,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: fullWidth ? '100%' : undefined,
          transition: 'transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease',
          ...style,
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        {...rest}
      >
        {loading && <Loader2 size={15} className="soft-pulse" style={{ animation: 'spin 0.9s linear infinite' }} />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
