import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine,
  Siren,
  Droplet,
  Pill,
  Stethoscope,
  AlertTriangle,
  Phone,
  MapPin,
  QrCode,
  Nfc,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { ScanReport, ScannerType } from '@/types'
import { DEMO_ACCOUNTS } from '@/lib/demoData'
import { severityColor, formatDate } from '@/lib/format'
import { Link } from 'react-router-dom'

export default function PublicScanPage() {
  const [mode, setMode] = useState<'qr' | 'band'>('qr')
  const [code, setCode] = useState('')
  const [scannerType, setScannerType] = useState<ScannerType>('emergency')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ScanReport | null>(null)

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = mode === 'qr' ? await api.scan.scanQr(code.trim(), scannerType, location || undefined) : await api.scan.scanBand(code.trim(), scannerType, location || undefined)
      setReport(res)
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setReport(null)
    setCode('')
    setError(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'var(--critical-red-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--critical-red)',
            }}
          >
            <Siren size={17} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>LifeCode Responder View</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Public emergency scan — no login required</div>
          </div>
        </div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to LifeCode
        </Link>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px 60px' }}>
        <AnimatePresence mode="wait">
          {!report && !loading && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'var(--signal-cyan-dim)',
                    color: 'var(--signal-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <ScanLine size={26} />
                </div>
                <h1 style={{ fontSize: 24, marginBottom: 6 }}>Scan a LifeBand</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Enter the QR code or band ID from a LifeBand wristband to pull up the wearer's emergency profile.
                </p>
              </div>

              <Card>
                <form onSubmit={handleScan}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button
                      type="button"
                      onClick={() => setMode('qr')}
                      style={tabStyle(mode === 'qr')}
                    >
                      <QrCode size={14} /> QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('band')}
                      style={tabStyle(mode === 'band')}
                    >
                      <Nfc size={14} /> Band / NFC ID
                    </button>
                  </div>

                  <input
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={mode === 'qr' ? 'QR-YOUSSEF-0001' : 'NFC-YB-0001 or SN-2026-00001'}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      borderRadius: 12,
                      border: '1px solid var(--border-hairline-strong)',
                      background: 'var(--bg-base)',
                      color: 'var(--text-primary)',
                      fontSize: 16,
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      marginBottom: 14,
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    <Select value={scannerType} onChange={(e) => setScannerType(e.target.value as ScannerType)}>
                      <option value="emergency">Emergency responder</option>
                      <option value="hospital">Hospital</option>
                      <option value="public">Member of the public</option>
                      <option value="personal">Personal device</option>
                    </Select>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location (optional)"
                      style={{
                        padding: '11px 13px',
                        borderRadius: 10,
                        border: '1px solid var(--border-hairline-strong)',
                        background: 'var(--bg-base)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                      }}
                    />
                  </div>

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
                      <AlertTriangle size={15} /> {error}
                    </div>
                  )}

                  <Button type="submit" fullWidth size="lg" variant="critical" loading={loading}>
                    <ScanLine size={16} /> Scan LifeBand
                  </Button>
                </form>
              </Card>

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>TRY A DEMO SCAN</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.userID}
                      onClick={() => {
                        setMode('qr')
                        setCode(a.wristbands[0]?.QRCode ?? '')
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1px solid var(--border-hairline-strong)',
                        background: 'var(--bg-panel-raised)',
                        color: 'var(--text-primary)',
                        fontSize: 12.5,
                        cursor: 'pointer',
                      }}
                    >
                      {a.username}'s LifeBand
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PageLoader label="Retrieving emergency profile…" />
            </motion.div>
          )}

          {report && !loading && (
            <motion.div key="report" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <ScanReportView report={report} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '9px 0',
    borderRadius: 9,
    border: active ? '1px solid var(--signal-cyan)' : '1px solid var(--border-hairline-strong)',
    background: active ? 'var(--signal-cyan-dim)' : 'transparent',
    color: active ? 'var(--signal-cyan)' : 'var(--text-secondary)',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  }
}

function ScanReportView({ report, onReset }: { report: ScanReport; onReset: () => void }) {
  const hasCritical = report.medical.HasAllergies || report.medical.EmergencyInstructions

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Badge tone="green">LifeBand verified</Badge>
        <Button size="sm" variant="secondary" onClick={onReset}>
          Scan another
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 16,
              background: 'var(--signal-cyan-dim)',
              color: 'var(--signal-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {report.user.PhotoURL ? (
              <img src={report.user.PhotoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              report.user.Username?.slice(0, 2).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{report.user.Username}</h2>
            {report.user.Address && (
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={12} /> {report.user.Address}
              </p>
            )}
          </div>
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'var(--critical-red-dim)',
              border: '1px solid rgba(251,75,75,0.35)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 10.5, color: 'var(--critical-red)', letterSpacing: '0.04em' }}>BLOOD TYPE</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--critical-red)' }}>
              {report.medical.BloodType ?? '—'}
            </div>
          </div>
        </div>
      </Card>

      {hasCritical && (
        <Card style={{ marginBottom: 16, borderColor: 'rgba(251,75,75,0.4)', background: 'var(--critical-red-dim)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <ShieldAlert size={20} color="var(--critical-red)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: 14, color: 'var(--critical-red)', marginBottom: 6 }}>Critical alert</h4>
              {report.medical.EmergencyInstructions && (
                <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.55 }}>
                  {report.medical.EmergencyInstructions}
                </p>
              )}
              {report.medical.Allergies.filter((a) => a.Severity === 'Severe').map((a) => (
                <div key={a.AllergyType} style={{ fontSize: 13, color: 'var(--critical-red)', fontWeight: 600 }}>
                  ⚠ Severe allergy: {a.AllergyType}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <Card>
          <SectionTitle icon={<Stethoscope size={15} />} title="Medical conditions" />
          {report.medical.MedicalConditions.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {report.medical.MedicalConditions.map((c) => (
                <Badge key={c} tone="cyan">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>None reported</p>
          )}
        </Card>

        <Card>
          <SectionTitle icon={<Droplet size={15} />} title="Allergies" />
          {report.medical.HasAllergies && report.medical.Allergies.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.medical.Allergies.map((a) => (
                <div key={a.AllergyType} style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{a.AllergyType}</span>{' '}
                  <span style={{ color: severityColor(a.Severity), fontSize: 11.5 }}>({a.Severity})</span>
                  {a.Notes && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{a.Notes}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>No known allergies</p>
          )}
        </Card>

        <Card>
          <SectionTitle icon={<Pill size={15} />} title="Medications" />
          {report.medical.HasMedications && report.medical.Medications.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.medical.Medications.map((m) => (
                <div key={m.MedicationName} style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{m.MedicationName}</span> — {m.Dosage}
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.Schedule}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>None reported</p>
          )}
        </Card>

        <Card>
          <SectionTitle icon={<Stethoscope size={15} />} title="Surgical history" />
          {report.medical.HasSurgeries && report.medical.Surgeries.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report.medical.Surgeries.map((s) => (
                <div key={s.SurgeryName} style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{s.SurgeryName}</span>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(s.SurgeryDate)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>None reported</p>
          )}
        </Card>
      </div>

      {report.emergencyContacts.length > 0 && (
        <Card>
          <SectionTitle icon={<Phone size={15} />} title="Emergency contacts" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {report.emergencyContacts.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.ContactName}</span>{' '}
                  <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>({c.relationship})</span>
                </div>
                <a href={`tel:${c.phoneNumbers[0]}`} className="mono" style={{ fontSize: 13, color: 'var(--signal-cyan)', textDecoration: 'none' }}>
                  {c.phoneNumbers[0]}
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 16, textAlign: 'center' }}>
        Scanned {formatDate(report.scannedAt)} · Logged for the wearer's records
      </p>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-secondary)' }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
    </div>
  )
}
