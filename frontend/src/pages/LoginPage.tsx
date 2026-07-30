import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { api, toApiError } from '@/api'
import { DEMO_ACCOUNTS } from '@/lib/demoData'
import { useToast } from '@/hooks/useToast'
import { initials } from '@/lib/format'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { prefillEmail?: string; from?: string } }
  const setSession = useAuthStore((s) => s.setSession)
  const toast = useToast()

  const [email, setEmail] = useState(location.state?.prefillEmail ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await api.auth.login(email, password)
      setSession(session, session.sessionToken, session.refreshToken)
      toast.push('success', `Welcome back, ${session.username.split(' ')[0]}`)
      navigate(location.state?.from ?? '/app')
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  function quickFill(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError(null)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 60px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, textDecoration: 'none' }}>
          <img
            src="/life-band-icon.png"
            alt="LifeCode"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              objectFit: 'cover',
            }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            LifeCode
          </span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 380 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Sign in</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
            Access your LifeCode emergency profile.
          </p>

          <form onSubmit={handleSubmit}>
            <Field label="Email" required>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--critical-red-dim)',
                  color: 'var(--critical-red)',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                <ShieldAlert size={15} /> {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              <LogIn size={16} /> Sign in
            </Button>
          </form>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 20, textAlign: 'center' }}>
            No account yet? <Link to="/register" style={{ color: 'var(--signal-cyan)' }}>Create one</Link>
          </p>
        </motion.div>
      </div>

      <div
        style={{
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border-hairline)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px 60px',
        }}
      >
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16, letterSpacing: '0.04em' }}>
          DEMO ACCOUNTS — ALL PASSWORD: DemoPass123
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DEMO_ACCOUNTS.map((a) => (
            <Card key={a.userID} padding={16} raised style={{ cursor: 'pointer' }} onClick={() => quickFill(a.email, a.password)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--signal-cyan-dim)',
                    color: 'var(--signal-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {initials(a.username)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.tagline}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                    {a.email}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 16 }}>
          Click a card to autofill the sign-in form, then hit Sign in.
        </p>
      </div>
    </div>
  )
}
