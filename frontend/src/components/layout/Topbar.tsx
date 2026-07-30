import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, User as UserIcon, FlaskConical, Wifi } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { initials } from '@/lib/format'
import { IS_MOCK, api } from '@/api'
import { useToast } from '@/hooks/useToast'

export function Topbar() {
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleLogout() {
    try {
      await api.auth.logout()
    } catch {
      // ignore network errors on logout
    }
    clearSession()
    toast.push('info', 'Signed out', 'Your session has been cleared.')
    navigate('/login')
  }

  return (
    <header
      style={{
        height: 66,
        borderBottom: '1px solid var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 26px',
        position: 'sticky',
        top: 0,
        background: 'rgba(8,12,20,0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
          <path
            className="pulse-path"
            d="M0 10h10l3-7 5 14 3-10 2 3h37"
            stroke="var(--vital-green)"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            color: IS_MOCK ? 'var(--warning-amber)' : 'var(--vital-green)',
            background: IS_MOCK ? 'var(--warning-amber-dim)' : 'var(--vital-green-dim)',
            padding: '4px 10px',
            borderRadius: 999,
          }}
        >
          {IS_MOCK ? <FlaskConical size={12} /> : <Wifi size={12} />}
          {IS_MOCK ? 'DEMO DATA MODE' : 'LIVE API'}
        </span>
      </div>

      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: '1px solid var(--border-hairline)',
            borderRadius: 12,
            padding: '6px 10px 6px 6px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: 'linear-gradient(135deg, var(--signal-cyan-dim), var(--bg-panel-raised))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--signal-cyan)',
            }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials(user?.username ?? 'U')
            )}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.username?.split(' ')[0] ?? 'Account'}</span>
          <ChevronDown size={14} color="var(--text-tertiary)" />
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 210,
              background: 'var(--bg-panel-raised)',
              border: '1px solid var(--border-hairline-strong)',
              borderRadius: 12,
              padding: 6,
              boxShadow: 'var(--shadow-panel)',
              zIndex: 30,
            }}
          >
            <button
              onClick={() => {
                setOpen(false)
                navigate('/app/settings')
              }}
              style={menuItemStyle}
            >
              <UserIcon size={15} /> Account settings
            </button>
            <button onClick={handleLogout} style={{ ...menuItemStyle, color: 'var(--critical-red)' }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  padding: '9px 10px',
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
}
