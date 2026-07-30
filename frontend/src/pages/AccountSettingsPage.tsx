import { useEffect, useState } from 'react'
import { KeyRound, Bell, Eye, Monitor, Smartphone, LogOut, AlertTriangle } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { Session, UserPreferences } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { timeAgo } from '@/lib/format'
import { useNavigate } from 'react-router-dom'

export default function AccountSettingsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    Promise.all([api.account.getPreferences(), api.auth.getSessions()])
      .then(([p, s]) => {
        setPrefs(p)
        setSessions(s as Session[])
      })
      .catch((err) => toast.push('error', 'Could not load settings', toApiError(err).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function updatePref(key: keyof UserPreferences, value: boolean) {
    if (!prefs) return
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try {
      await api.account.updatePreferences({ [key]: value })
    } catch (err) {
      toast.push('error', 'Could not save preference', toApiError(err).message)
      setPrefs(prefs)
    }
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      await api.auth.revokeSession(sessionId)
      setSessions((s) => s.filter((x) => x.sessionId !== sessionId))
      toast.push('info', 'Session revoked')
    } catch (err) {
      toast.push('error', 'Could not revoke session', toApiError(err).message)
    }
  }

  async function handleDeleteAccount() {
    try {
      await api.account.deleteAccount()
      clearSession()
      toast.push('info', 'Account deactivated')
      navigate('/')
    } catch (err) {
      toast.push('error', 'Could not delete account', toApiError(err).message)
    }
  }

  if (loading || !prefs) return <PageLoader label="Loading account settings…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Account settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Security, privacy and session management.</p>
      </div>

      <PasswordCard />

      <Card>
        <CardHeader title="Scan privacy" subtitle="Control exactly what a scanner sees when your LifeBand is scanned." />
        <PrefToggle
          icon={<Eye size={15} />}
          label="Show medical details on scan"
          checked={prefs.showMedicalOnScan}
          onChange={(v) => updatePref('showMedicalOnScan', v)}
        />
        <PrefToggle
          icon={<Eye size={15} />}
          label="Show emergency contacts on scan"
          checked={prefs.showContactsOnScan}
          onChange={(v) => updatePref('showContactsOnScan', v)}
        />
        <PrefToggle
          icon={<Eye size={15} />}
          label="Show profile photo on scan"
          checked={prefs.showPhotoOnScan}
          onChange={(v) => updatePref('showPhotoOnScan', v)}
        />
      </Card>

      <Card>
        <CardHeader title="Notifications" />
        <PrefToggle
          icon={<Bell size={15} />}
          label="Push notifications"
          checked={prefs.pushNotifications}
          onChange={(v) => updatePref('pushNotifications', v)}
        />
        <PrefToggle
          icon={<Bell size={15} />}
          label="Email notifications"
          checked={prefs.emailNotifications}
          onChange={(v) => updatePref('emailNotifications', v)}
        />
      </Card>

      <Card>
        <CardHeader title="Active sessions" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((s) => (
            <div
              key={s.sessionId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.deviceType === 'mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.deviceName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>Active {timeAgo(s.lastActive)}</div>
                </div>
              </div>
              {s.isCurrent ? (
                <Badge tone="green">This device</Badge>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => handleRevokeSession(s.sessionId)}>
                  <LogOut size={13} /> Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ borderColor: 'rgba(251,75,75,0.3)' }}>
        <CardHeader title="Danger zone" subtitle="Deactivating your account revokes all sessions and hides your LifeBand from scans." />
        <Button variant="critical" onClick={() => setDeleteOpen(true)}>
          <AlertTriangle size={15} /> Delete account
        </Button>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account?">
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          This will deactivate your account, sign you out of every device, and stop your LifeBand from
          returning any data on scan. This can't be undone from here.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" fullWidth onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="critical" fullWidth onClick={handleDeleteAccount}>
            Yes, delete my account
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function PasswordCard() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      toast.push('error', 'Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await api.account.changePassword(current, next)
      toast.push('success', 'Password updated')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      toast.push('error', 'Could not update password', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Password" />
      <form onSubmit={handleSubmit}>
        <Field label="Current password" required>
          <Input type="password" required value={current} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" required hint="At least 8 characters">
          <Input type="password" required value={next} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNext(e.target.value)} />
        </Field>
        <Field label="Confirm new password" required>
          <Input type="password" required value={confirm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)} />
        </Field>
        <Button type="submit" loading={saving}>
          <KeyRound size={15} /> Update password
        </Button>
      </form>
    </Card>
  )
}

function PrefToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-hairline)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-primary)' }}>
        {icon}
        {label}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          border: 'none',
          background: checked ? 'var(--signal-cyan)' : 'var(--bg-panel-raised)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s ease',
          }}
        />
      </button>
    </div>
  )
}
