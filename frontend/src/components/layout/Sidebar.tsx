import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  UserRound,
  HeartPulse,
  Contact,
  Users,
  Watch,
  ScanLine,
  Settings,
  Radio,
} from 'lucide-react'
import { cls } from '@/lib/format'

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/personal', label: 'Personal Info', icon: UserRound },
  { to: '/app/medical', label: 'Medical Profile', icon: HeartPulse },
  { to: '/app/contacts', label: 'Emergency Contacts', icon: Contact },
  { to: '/app/family', label: 'Family', icon: Users },
  { to: '/app/wristband', label: 'LifeBand', icon: Watch },
  { to: '/app/scans', label: 'Scan History', icon: ScanLine },
  { to: '/app/settings', label: 'Account Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside
      style={{
        width: 252,
        flexShrink: 0,
        borderRight: '1px solid var(--border-hairline)',
        background: 'var(--bg-panel)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="/life-band-icon.png"
          alt="LifeCode"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            objectFit: 'cover',
          }}
        />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
            LifeCode
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginTop: 2 }}>
            SCAN FOR LIFE
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cls(
                'sidebar-link',
                isActive && 'sidebar-link-active',
              )
            }
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-panel-raised)' : 'transparent',
              border: isActive ? '1px solid var(--border-hairline-strong)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'background 0.15s ease, color 0.15s ease',
            })}
          >
            <Icon size={16.5} color={undefined} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: 16 }}>
        <NavLink
          to="/emergency-scan"
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 13px',
            borderRadius: 12,
            border: '1px solid rgba(251,75,75,0.35)',
            background: 'var(--critical-red-dim)',
            color: 'var(--critical-red)',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Radio size={16} />
          Open Responder View
        </NavLink>
      </div>
    </aside>
  )
}
