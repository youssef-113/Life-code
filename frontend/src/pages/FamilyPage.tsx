import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Users, QrCode, ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { BloodType, FamilyProfile, FamilyRelation } from '@/types'
import { useToast } from '@/hooks/useToast'

const RELATIONS: FamilyRelation[] = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Other']
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const emptyDraft = {
  Name: '',
  Relation: 'Other' as FamilyRelation,
  Age: '' as number | '',
  BloodType: '' as BloodType | '',
  IsChild: false,
  LostChildMode: false,
}

export default function FamilyPage() {
  const toast = useToast()
  const [members, setMembers] = useState<FamilyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyProfile | null>(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setMembers(await api.family.list())
  }

  useEffect(() => {
    refresh()
      .catch((err) => toast.push('error', 'Could not load family profiles', toApiError(err).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openAdd() {
    setEditing(null)
    setDraft(emptyDraft)
    setModalOpen(true)
  }

  function openEdit(m: FamilyProfile) {
    setEditing(m)
    setDraft({
      Name: m.Name,
      Relation: m.Relation === 'Self' ? 'Other' : m.Relation,
      Age: m.Age ?? '',
      BloodType: m.BloodType ?? '',
      IsChild: m.IsChild,
      LostChildMode: m.LostChildMode,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      Name: draft.Name,
      Relation: draft.Relation,
      Age: draft.Age === '' ? null : Number(draft.Age),
      BloodType: draft.BloodType || null,
      IsChild: draft.IsChild,
      LostChildMode: draft.LostChildMode,
    }
    try {
      if (editing) {
        await api.family.update(editing.id, payload)
        toast.push('success', 'Family profile updated')
      } else {
        await api.family.add(payload)
        toast.push('success', 'Family member added')
      }
      await refresh()
      setModalOpen(false)
    } catch (err) {
      toast.push('error', 'Save failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.family.remove(id)
      await refresh()
      toast.push('info', 'Family member removed')
    } catch (err) {
      toast.push('error', 'Could not remove member', toApiError(err).message)
    }
  }

  async function toggleLostChild(m: FamilyProfile) {
    try {
      await api.family.update(m.id, { LostChildMode: !m.LostChildMode })
      await refresh()
      toast.push(!m.LostChildMode ? 'warning' : 'info', !m.LostChildMode ? 'Lost Child Mode enabled' : 'Lost Child Mode disabled')
    } catch (err) {
      toast.push('error', 'Could not update', toApiError(err).message)
    }
  }

  if (loading) return <PageLoader label="Loading family profiles…" />

  const dependents = members.filter((m) => m.ProfileType === 'Dependent')
  const self = members.find((m) => m.ProfileType === 'Main')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 780 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Family & dependents</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Manage LifeBand profiles for children and relatives in your care.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={15} /> Add family member
        </Button>
      </div>

      {self && (
        <Card padding={16}>
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
              }}
            >
              <QrCode size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{self.Name} (You)</div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{self.QRCode}</div>
            </div>
            <Badge tone="neutral" mono>
              {self.BloodType ?? '—'}
            </Badge>
          </div>
        </Card>
      )}

      {dependents.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={22} />}
            title="No dependents added"
            description="Add children or relatives so they can also carry a LifeBand."
            action={
              <Button onClick={openAdd}>
                <Plus size={15} /> Add a family member
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {dependents.map((m) => (
            <Card key={m.id} padding={18}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 15, marginBottom: 4 }}>{m.Name}</h4>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Badge tone="neutral">{m.Relation}</Badge>
                    {m.Age !== null && <Badge tone="neutral">{m.Age} yrs</Badge>}
                    {m.BloodType && <Badge tone="red" mono>{m.BloodType}</Badge>}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.QRCode}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(m.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>

              {m.IsChild && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid var(--border-hairline)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={14} color={m.LostChildMode ? 'var(--critical-red)' : 'var(--text-tertiary)'} />
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Lost Child Mode</span>
                  </div>
                  <Button
                    size="sm"
                    variant={m.LostChildMode ? 'critical' : 'secondary'}
                    onClick={() => toggleLostChild(m)}
                  >
                    {m.LostChildMode ? 'Active' : 'Enable'}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit family member' : 'Add family member'}>
        <form onSubmit={handleSubmit}>
          <Field label="Name" required>
            <Input required value={draft.Name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, Name: e.target.value })} />
          </Field>
          <Field label="Relation" required>
            <Select value={draft.Relation} onChange={(e) => setDraft({ ...draft, Relation: e.target.value as FamilyRelation })}>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Age">
            <Input
              type="number"
              min={0}
              value={draft.Age}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, Age: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </Field>
          <Field label="Blood type">
            <Select value={draft.BloodType} onChange={(e) => setDraft({ ...draft, BloodType: e.target.value as BloodType })}>
              <option value="">Unknown</option>
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={draft.IsChild} onChange={(e) => setDraft({ ...draft, IsChild: e.target.checked })} />
            This is a child (enables Lost Child Mode)
          </label>
          <Button type="submit" fullWidth loading={saving}>
            {editing ? 'Save changes' : 'Add family member'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
