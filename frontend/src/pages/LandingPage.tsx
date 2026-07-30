import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartPulse, ScanLine, Users, ShieldCheck, Watch, ArrowRight, Radio } from 'lucide-react'
import { LifeBandScene } from '@/components/three/LifeBandScene'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DEMO_ACCOUNTS } from '@/lib/demoData'
import { initials } from '@/lib/format'

const FEATURES = [
  {
    icon: HeartPulse,
    title: 'One scan, full picture',
    body: 'Blood type, allergies, medications, surgeries and conditions — instantly readable by any responder.',
  },
  {
    icon: Users,
    title: 'Family & dependents',
    body: 'Manage LifeBands for children and elderly relatives, with Lost Child Mode for extra protection.',
  },
  {
    icon: Watch,
    title: 'QR + NFC wristbands',
    body: 'Register, activate, revoke and swap wristbands as your primary LifeBand at any time.',
  },
  {
    icon: ShieldCheck,
    title: 'You control what\u2019s shown',
    body: 'Granular preferences decide exactly what a scanner sees — medical data, contacts, or your photo.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 32px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>LifeCode</span>
        </div>
        <nav style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/emergency-scan')}>
            <Radio size={14} /> Responder view
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/register')}>
            Get your LifeBand
          </Button>
        </nav>
      </header>

      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '30px 32px 10px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--signal-cyan)',
              background: 'var(--signal-cyan-dim)',
              padding: '5px 12px',
              borderRadius: 999,
              marginBottom: 18,
            }}
          >
            <ScanLine size={13} /> Emergency Health Identity Network
          </span>
          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.06,
              marginBottom: 18,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Your medical story,
            <br />
            readable in <span style={{ color: 'var(--signal-cyan)' }}>one scan.</span>
          </h1>
          <p style={{ fontSize: 16.5, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6, marginBottom: 30 }}>
            LifeCode links a QR + NFC wristband to your emergency medical profile — so when
            seconds matter, first responders get the full picture without waiting for you to speak.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 34 }}>
            <Button size="lg" onClick={() => navigate('/register')}>
              Create your profile <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
              Explore with a demo account
            </Button>
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, letterSpacing: '0.04em' }}>
              JUMP STRAIGHT IN — TRY A SEEDED DEMO PROFILE
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.userID}
                  onClick={() => navigate('/login', { state: { prefillEmail: a.email } })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 12px 8px 8px',
                    borderRadius: 12,
                    background: 'var(--bg-panel-raised)',
                    border: '1px solid var(--border-hairline-strong)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: 'var(--signal-cyan-dim)',
                      color: 'var(--signal-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11.5,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials(a.username)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.username}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{a.tagline.split(' · ')[0]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{ height: 460 }}
        >
          <LifeBandScene />
        </motion.div>
      </section>

      <section style={{ maxWidth: 1200, margin: '40px auto 0', padding: '0 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--signal-cyan-dim)',
                    color: 'var(--signal-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <f.icon size={19} />
                </div>
                <h4 style={{ fontSize: 15, marginBottom: 8 }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <footer
        style={{
          maxWidth: 1200,
          margin: '60px auto 0',
          padding: '24px 32px',
          borderTop: '1px solid var(--border-hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12.5,
          color: 'var(--text-tertiary)',
        }}
      >
        <span>© {new Date().getFullYear()} LifeCode. Built for the moments that matter most.</span>
        <span className="mono">Demo build</span>
      </footer>
    </div>
  )
}
