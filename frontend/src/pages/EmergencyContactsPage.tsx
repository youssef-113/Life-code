import { useEffect, useState } from 'react'
import { Plus, Phone, Star, Pencil, Trash2, Contact as ContactIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { EmergencyContact, Relationship } from '@/types'
import { useToast } from '@/hooks/useToast'

const RELATIONSHIPS: Relationship[] = ['Father', 'Mother', 'Spouse', 'Sister', 'Brother', 'Friend', 'Other']

const emptyDraft = {
  ContactName: '',
  phoneNumbers: [''],
  relationship: 'Other' as Relationship,
  isPrimary: false,
  notes: '',
}

export default function EmergencyContactsPage() {
  const toast = useToast()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmergencyContact | null>(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const list = await api.contacts.list()
    setContacts(list)
  }

  useEffect(() => {
    refresh()
      .catch((err) => toast.push('error', 'Could not load contacts', toApiError(err).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openAdd() {
    setEditing(null)
    setDraft(emptyDraft)
    setModalOpen(true)
  }

  function openEdit(c: EmergencyContact) {
    setEditing(c)
    setDraft({
      ContactName: c.ContactName,
      phoneNumbers: c.phoneNumbers.length ? c.phoneNumbers : [''],
      relationship: c.relationship,
      isPrimary: c.isPrimary,
      notes: c.notes ?? '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...draft, phoneNumbers: draft.phoneNumbers.filter(Boolean) }
    try {
      if (editing) {
        await api.contacts.update(editing.id, payload)
        toast.push('success', 'Contact updated')
      } else {
        await api.contacts.add(payload)
        toast.push('success', 'Contact added')
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
      await api.contacts.remove(id)
      await refresh()
      toast.push('info', 'Contact removed')
    } catch (err) {
      toast.push('error', 'Could not remove contact', toApiError(err).message)
    }
  }

  async function handleSetPrimary(id: string) {
    try {
      await api.contacts.setPrimary(id)
      await refresh()
      toast.push('success', 'Primary contact updated')
    } catch (err) {
      toast.push('error', 'Update failed', toApiError(err).message)
    }
  }

  if (loading) return <PageLoader label="Loading emergency contacts…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Emergency contacts</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Up to 10 people responders can call on your behalf.</p>
        </div>
        <Button onClick={openAdd} disabled={contacts.length >= 10}>
          <Plus size={15} /> Add contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ContactIcon size={22} />}
            title="No emergency contacts yet"
            description="Add at least one person a responder can reach in an emergency."
            action={
              <Button onClick={openAdd}>
                <Plus size={15} /> Add your first contact
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contacts.map((c) => (
            <Card key={c.id} padding={18}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 15 }}>{c.ContactName}</h4>
                    {c.isPrimary && <Badge tone="green" icon={<Star size={11} />}>Primary</Badge>}
                    <Badge tone="neutral">{c.relationship}</Badge>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: c.notes ? 6 : 0 }}>
                    {c.phoneNumbers.map((p) => (
                      <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)' }} className="mono">
                        <Phone size={13} /> {p}
                      </span>
                    ))}
                  </div>
                  {c.notes && <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{c.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!c.isPrimary && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetPrimary(c.id)}>
                      <Star size={13} />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit contact' : 'Add emergency contact'}>
        <form onSubmit={handleSubmit}>
          <Field label="Contact name" required>
            <Input required value={draft.ContactName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, ContactName: e.target.value })} />
          </Field>
          <Field label="Relationship" required>
            <Select value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value as Relationship })}>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Phone number(s)" required>
            {draft.phoneNumbers.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  required={i === 0}
                  value={p}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      phoneNumbers: draft.phoneNumbers.map((x, idx) => (idx === i ? (e as React.ChangeEvent<HTMLInputElement>).target.value : x)),
                    })
                  }
                  placeholder="+201001234567"
                />
                {draft.phoneNumbers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDraft({ ...draft, phoneNumbers: draft.phoneNumbers.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setDraft({ ...draft, phoneNumbers: [...draft.phoneNumbers, ''] })}
            >
              <Plus size={13} /> Add another number
            </Button>
          </Field>
          <Field label="Notes">
            <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={2} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 18, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={draft.isPrimary}
              onChange={(e) => setDraft({ ...draft, isPrimary: e.target.checked })}
            />
            Set as primary contact
          </label>
          <Button type="submit" fullWidth loading={saving}>
            {editing ? 'Save changes' : 'Add contact'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
