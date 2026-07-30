import { useEffect, useState } from 'react'
import { Plus, Watch, Star, Power, Ban, QrCode, Nfc } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { Wristband } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/lib/format'

export default function WristbandPage() {
  const toast = useToast()
  const [bands, setBands] = useState<Wristband[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [nfcTag, setNfcTag] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setBands(await api.wristband.list())
  }

  useEffect(() => {
    refresh()
      .catch((err) => toast.push('error', 'Could not load wristbands', toApiError(err).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.wristband.register(qrCode || undefined, nfcTag || undefined)
      await refresh()
      toast.push('success', 'Wristband registered', 'Activate it once you receive the physical band.')
      setModalOpen(false)
      setQrCode('')
      setNfcTag('')
    } catch (err) {
      toast.push('error', 'Registration failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.wristband.activate(id)
      await refresh()
      toast.push('success', 'Wristband activated')
    } catch (err) {
      toast.push('error', 'Could not activate', toApiError(err).message)
    }
  }

  async function handleRevoke(id: string) {
    try {
      await api.wristband.revoke(id, 'Revoked from dashboard')
      await refresh()
      toast.push('warning', 'Wristband revoked')
    } catch (err) {
      toast.push('error', 'Could not revoke', toApiError(err).message)
    }
  }

  async function handleSetPrimary(id: string) {
    try {
      await api.wristband.setPrimary(id)
      await refresh()
      toast.push('success', 'Primary wristband updated')
    } catch (err) {
      toast.push('error', 'Could not update', toApiError(err).message)
    }
  }

  if (loading) return <PageLoader label="Reading wristband registry…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>LifeBand wristbands</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Your QR + NFC wristbands, and which one is primary.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Register wristband
        </Button>
      </div>

      {bands.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Watch size={22} />}
            title="No wristbands registered"
            description="Register the QR code or NFC tag printed on your LifeBand to link it to your profile."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={15} /> Register your first band
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bands.map((b) => (
            <Card key={b.id} padding={18}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ fontSize: 15 }} className="mono">{b.SerialNumber}</h4>
                    {b.IsPrimary && <Badge tone="green" icon={<Star size={11} />}>Primary</Badge>}
                    <Badge tone={b.Status === 'active' ? 'green' : b.Status === 'revoked' ? 'red' : 'amber'}>
                      {b.Status}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <QrCode size={13} /> <span className="mono">{b.QRCode}</span>
                    </span>
                    {b.NFCTag && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Nfc size={13} /> <span className="mono">{b.NFCTag}</span>
                      </span>
                    )}
                  </div>
                  {b.ActivatedAt && (
                    <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>
                      Activated {formatDateTime(b.ActivatedAt)}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {b.Status === 'pending' && (
                    <Button size="sm" variant="secondary" onClick={() => handleActivate(b.id)}>
                      <Power size={13} /> Activate
                    </Button>
                  )}
                  {!b.IsPrimary && b.Status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetPrimary(b.id)}>
                      <Star size={13} /> Make primary
                    </Button>
                  )}
                  {b.Status !== 'revoked' && (
                    <Button size="sm" variant="danger" onClick={() => handleRevoke(b.id)}>
                      <Ban size={13} /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register a wristband">
        <form onSubmit={handleRegister}>
          <Field label="QR code" hint="Printed on the back of your physical LifeBand">
            <Input value={qrCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQrCode(e.target.value)} placeholder="QR-XXXXXXX" />
          </Field>
          <Field label="NFC tag ID" hint="Optional — only if your band supports NFC">
            <Input value={nfcTag} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNfcTag(e.target.value)} placeholder="NFC-XXXXXXX" />
          </Field>
          <Button type="submit" fullWidth loading={saving} disabled={!qrCode && !nfcTag}>
            Register wristband
          </Button>
        </form>
      </Modal>
    </div>
  )
}
