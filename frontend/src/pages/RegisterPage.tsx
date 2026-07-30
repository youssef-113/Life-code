import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { api, toApiError } from '@/api'
import { useToast } from '@/hooks/useToast'
import { LifeBandScene } from '@/components/three/LifeBandScene'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const toast = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const session = await api.auth.register(name, email, password)
      setSession(session, session.sessionToken, session.refreshToken)
      toast.push('success', 'Account created', 'Let\u2019s build out your emergency profile.')
      navigate('/app')
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
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
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Create your profile</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
            Takes two minutes. You can fill in medical details afterward.
          </p>

          <form onSubmit={handleSubmit}>
            <Field label="Full name" required>
              <Input required value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Jane Doe" />
            </Field>
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
            <Field label="Password" required hint="At least 8 characters">
              <Input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirm password" required>
              <Input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
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
              <UserPlus size={16} /> Create account
            </Button>
          </form>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 20, textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--signal-cyan)' }}>Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div
        style={{
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', height: 420 }}>
          <LifeBandScene />
        </div>
      </div>
    </div>
  )
}
