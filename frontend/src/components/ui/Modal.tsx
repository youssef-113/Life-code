import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 480,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5,8,14,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: width,
              maxHeight: '86vh',
              overflowY: 'auto',
              background: 'var(--bg-panel-raised)',
              border: '1px solid var(--border-hairline-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-panel)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 17 }}>{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 8,
                  padding: 6,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
