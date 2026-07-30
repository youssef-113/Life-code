import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Droplet, Pill, Stethoscope, Contact, ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { MedicalProfileDashboard } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'

export default function DashboardHome() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [dash, setDash] = useState<MedicalProfileDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.medical
      .getDashboard()
      .then((d) => active && setDash(d as MedicalProfileDashboard))
      .catch((err) => toast.push('error', 'Could not load dashboard', toApiError(err).message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <PageLoader label="Reading profile vitals…" />
  if (!dash) return null

  const stats = [
    { icon: Droplet, label: 'Blood type', value: dash.quickStats.bloodType ?? '—', tone: 'red' as const },
    { icon: Sparkles, label: 'Allergies', value: dash.quickStats.allergiesCount, tone: 'amber' as const },
    { icon: Pill, label: 'Medications', value: dash.quickStats.medicationsCount, tone: 'cyan' as const },
    { icon: Stethoscope, label: 'Surgeries', value: dash.quickStats.surgeriesCount, tone: 'green' as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Hey, {user?.username?.split(' ')[0]} 👋</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Here's how ready your emergency profile is for a first responder.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ProgressRing value={dash.profileCompletion} level={dash.completionLevel} size={104} />
            <div style={{ flex: 1 }}>
              <Badge tone={dash.completionLevel === 'complete' ? 'green' : dash.completionLevel === 'low' ? 'red' : 'amber'}>
                {dash.completionLevel.toUpperCase()} COMPLETION
              </Badge>
              <h3 style={{ fontSize: 17, marginTop: 10, marginBottom: 6 }}>
                {dash.profileCompletion === 100 ? 'Your profile is complete' : 'Next recommended step'}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                {dash.nextRecommendedStep}
              </p>
              <Button size="sm" onClick={() => navigate('/app/medical')}>
                Continue setup <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Emergency contact" />
          {dash.sections.emergencyContact.completed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'var(--signal-cyan-dim)',
                  color: 'var(--signal-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Contact size={19} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {(dash.sections.emergencyContact.data as { ContactName?: string })?.ContactName ?? 'Primary contact set'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Reachable in an emergency</div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                No emergency contact on file yet — add one so responders know who to call.
              </p>
              <Button size="sm" variant="secondary" onClick={() => navigate('/app/contacts')}>
                Add contact
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card padding={18}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Badge tone={s.tone} icon={<s.icon size={12} />}>
                  {s.label}
                </Badge>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <QuickLink
          title="Medical profile"
          body="Blood type, conditions, allergies, medications and surgeries."
          onClick={() => navigate('/app/medical')}
        />
        <QuickLink
          title="LifeBand wristbands"
          body="Register, activate or revoke your QR + NFC wristbands."
          onClick={() => navigate('/app/wristband')}
        />
        <QuickLink
          title="Scan history"
          body="See every time your LifeBand has been scanned, and by whom."
          onClick={() => navigate('/app/scans')}
        />
      </div>
    </div>
  )
}

function QuickLink({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <Card padding={18} style={{ cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: 14.5, marginBottom: 6 }}>{title}</h4>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{body}</p>
        </div>
        <ArrowRight size={16} color="var(--text-tertiary)" />
      </div>
    </Card>
  )
}
