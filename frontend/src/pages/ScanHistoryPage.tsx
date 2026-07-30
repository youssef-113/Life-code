import { useEffect, useState } from 'react'
import { ScanLine, MapPin, Siren, Hospital, Globe, User as UserIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { ScanHistoryEntry, ScannerType } from '@/types'
import { useToast } from '@/hooks/useToast'
import { formatDateTime, timeAgo } from '@/lib/format'

const SCANNER_META: Record<ScannerType, { label: string; icon: typeof Siren; tone: 'red' | 'cyan' | 'neutral' | 'green' }> = {
  emergency: { label: 'Emergency responder', icon: Siren, tone: 'red' },
  hospital: { label: 'Hospital', icon: Hospital, tone: 'cyan' },
  public: { label: 'Public scan', icon: Globe, tone: 'neutral' },
  personal: { label: 'Personal device', icon: UserIcon, tone: 'green' },
}

export default function ScanHistoryPage() {
  const toast = useToast()
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.scan
      .history()
      .then((h) => setEntries(h as ScanHistoryEntry[]))
      .catch((err) => toast.push('error', 'Could not load scan history', toApiError(err).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <PageLoader label="Reading scan log…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Scan history</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Every time your LifeBand has been scanned.</p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ScanLine size={22} />}
            title="No scans yet"
            description="Once your LifeBand is scanned by a responder, hospital, or anyone else, it'll show up here."
          />
        </Card>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div
            style={{
              position: 'absolute',
              left: 5,
              top: 8,
              bottom: 8,
              width: 2,
              background: 'var(--border-hairline-strong)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {entries.map((entry) => {
              const meta = SCANNER_META[entry.ScannerType] ?? SCANNER_META.public
              const Icon = meta.icon
              return (
                <div key={entry.id} style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -20,
                      top: 4,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: 'var(--bg-base)',
                      border: '2px solid var(--signal-cyan)',
                    }}
                  />
                  <Card padding={16}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            background: 'var(--bg-panel-raised)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                            <MapPin size={12} /> {entry.Location}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{timeAgo(entry.ScannedAt)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDateTime(entry.ScannedAt)}</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
