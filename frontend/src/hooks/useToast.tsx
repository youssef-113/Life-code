import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

interface ToastContextValue {
  push: (kind: ToastKind, title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={18} color="var(--vital-green)" />,
  error: <XCircle size={18} color="var(--critical-red)" />,
  warning: <AlertTriangle size={18} color="var(--warning-amber)" />,
  info: <Info size={18} color="var(--signal-cyan)" />,
}

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++idCounter
      setToasts((t) => [...t, { id, kind, title, description }])
      window.setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 340,
          maxWidth: 'calc(100vw - 40px)',
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                background: 'var(--bg-panel-raised)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                boxShadow: 'var(--shadow-panel)',
              }}
            >
              <div style={{ marginTop: 2 }}>{ICONS[t.kind]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.title}</div>
                {t.description && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {t.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
