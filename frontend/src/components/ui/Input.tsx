import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'

const baseStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: 10,
  border: '1px solid var(--border-hairline-strong)',
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 0.15s ease',
}

interface FieldWrapProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: FieldWrapProps & { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--critical-red)' }}> *</span>}
        </span>
      )}
      {children}
      {hint && !error && (
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 5 }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{ display: 'block', fontSize: 12, color: 'var(--critical-red)', marginTop: 5 }}>
          {error}
        </span>
      )}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ style, ...rest }, ref) => (
    <input
      ref={ref}
      style={{ ...baseStyle, ...style }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--signal-cyan)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-hairline-strong)')}
      {...rest}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ style, ...rest }, ref) => (
    <textarea
      ref={ref}
      rows={3}
      style={{ ...baseStyle, resize: 'vertical', ...style }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--signal-cyan)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-hairline-strong)')}
      {...rest}
    />
  ),
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ style, children, ...rest }, ref) => (
    <select
      ref={ref}
      style={{ ...baseStyle, ...style }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--signal-cyan)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-hairline-strong)')}
      {...rest}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
