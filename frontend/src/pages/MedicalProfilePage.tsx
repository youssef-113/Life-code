import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { Allergy, BloodType, MedicalProfileDashboard, Medication, Severity, Surgery } from '@/types'
import { useToast } from '@/hooks/useToast'
import { cls } from '@/lib/format'

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const TABS = ['conditions', 'allergies', 'medications', 'surgeries', 'instructions'] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  conditions: 'Blood & Conditions',
  allergies: 'Allergies',
  medications: 'Medications',
  surgeries: 'Surgeries',
  instructions: 'Emergency Instructions',
}

export default function MedicalProfilePage() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('conditions')
  const [dash, setDash] = useState<MedicalProfileDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const d = await api.medical.getDashboard()
    setDash(d as MedicalProfileDashboard)
  }

  useEffect(() => {
    refresh()
      .catch((err) => toast.push('error', 'Could not load medical profile', toApiError(err).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || !dash) return <PageLoader label="Loading medical record…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Medical profile</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          The core information a responder needs to treat you safely.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border-hairline)', paddingBottom: 4 }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px 10px 0 0',
              border: 'none',
              background: tab === t ? 'var(--bg-panel-raised)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--signal-cyan)' : '2px solid transparent',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'conditions' && <ConditionsTab dash={dash} onSaved={refresh} />}
      {tab === 'allergies' && <AllergiesTab dash={dash} onSaved={refresh} />}
      {tab === 'medications' && <MedicationsTab dash={dash} onSaved={refresh} />}
      {tab === 'surgeries' && <SurgeriesTab dash={dash} onSaved={refresh} />}
      {tab === 'instructions' && <InstructionsTab />}
    </div>
  )
}

// ---------------- Blood type + conditions ----------------

function ConditionsTab({ dash, onSaved }: { dash: MedicalProfileDashboard; onSaved: () => Promise<void> }) {
  const toast = useToast()
  const [bloodType, setBloodType] = useState<BloodType | ''>(dash.sections.medicalProfile.data.bloodType ?? '')
  const [conditions, setConditions] = useState<string[]>(dash.sections.medicalProfile.data.medicalConditions)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function addCondition() {
    const v = draft.trim()
    if (!v) return
    setConditions((c) => [...c, v])
    setDraft('')
  }

  async function save() {
    setSaving(true)
    try {
      await api.medical.updateMedicalProfile({ bloodType: bloodType || null, medicalConditions: conditions })
      await onSaved()
      toast.push('success', 'Medical profile updated')
    } catch (err) {
      toast.push('error', 'Update failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Blood type & conditions" />
      <Field label="Blood type" required>
        <Select value={bloodType} onChange={(e) => setBloodType(e.target.value as BloodType)}>
          <option value="">Select blood type</option>
          {BLOOD_TYPES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Medical conditions">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <Input
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            placeholder="e.g. Type 1 Diabetes"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
          />
          <Button type="button" variant="secondary" onClick={addCondition}>
            <Plus size={14} />
          </Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {conditions.map((c, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 6px 5px 12px',
                borderRadius: 999,
                background: 'var(--bg-panel-raised)',
                border: '1px solid var(--border-hairline-strong)',
                fontSize: 12.5,
              }}
            >
              {c}
              <button
                onClick={() => setConditions((all) => all.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
          {conditions.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>None added yet</span>}
        </div>
      </Field>

      <Button onClick={save} loading={saving}>
        <Save size={15} /> Save
      </Button>
    </Card>
  )
}

// ---------------- Allergies ----------------

function AllergiesTab({ dash, onSaved }: { dash: MedicalProfileDashboard; onSaved: () => Promise<void> }) {
  const toast = useToast()
  const [hasAllergies, setHasAllergies] = useState(dash.sections.allergies.hasAllergiesFlag)
  const [items, setItems] = useState<Allergy[]>(dash.sections.allergies.items)
  const [saving, setSaving] = useState(false)

  function update(i: number, patch: Partial<Allergy>) {
    setItems((all) => all.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  }

  async function save() {
    setSaving(true)
    try {
      await api.medical.updateAllergies(hasAllergies, items)
      await onSaved()
      toast.push('success', 'Allergies updated')
    } catch (err) {
      toast.push('error', 'Update failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Allergies" action={<YesNoToggle value={hasAllergies} onChange={setHasAllergies} />} />
      {hasAllergies && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {items.map((a, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border-hairline)',
                borderRadius: 12,
                padding: 14,
                display: 'grid',
                gridTemplateColumns: '1fr 130px 32px',
                gap: 10,
                alignItems: 'start',
              }}
            >
              <div>
                <Input
                  value={a.allergyType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { allergyType: e.target.value })}
                  placeholder="Allergy (e.g. Penicillin)"
                  style={{ marginBottom: 8 }}
                />
                <Textarea
                  value={a.notes ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update(i, { notes: e.target.value })}
                  placeholder="Notes (reaction, what to avoid)"
                  rows={2}
                />
              </div>
              <Select value={a.severity} onChange={(e) => update(i, { severity: e.target.value as Severity })}>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </Select>
              <button
                onClick={() => setItems((all) => all.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--critical-red)', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setItems((all) => [...all, { allergyType: '', severity: 'Mild', notes: '' }])}
          >
            <Plus size={14} /> Add allergy
          </Button>
        </div>
      )}
      <Button onClick={save} loading={saving}>
        <Save size={15} /> Save
      </Button>
    </Card>
  )
}

// ---------------- Medications ----------------

function MedicationsTab({ dash, onSaved }: { dash: MedicalProfileDashboard; onSaved: () => Promise<void> }) {
  const toast = useToast()
  const [hasMedications, setHasMedications] = useState(dash.sections.medications.hasMedicationsFlag)
  const [items, setItems] = useState<Medication[]>(dash.sections.medications.items)
  const [saving, setSaving] = useState(false)

  function update(i: number, patch: Partial<Medication>) {
    setItems((all) => all.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  }

  async function save() {
    setSaving(true)
    try {
      await api.medical.updateMedications(hasMedications, items)
      await onSaved()
      toast.push('success', 'Medications updated')
    } catch (err) {
      toast.push('error', 'Update failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Current medications" action={<YesNoToggle value={hasMedications} onChange={setHasMedications} />} />
      {hasMedications && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {items.map((m, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border-hairline)',
                borderRadius: 12,
                padding: 14,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 32px',
                gap: 10,
              }}
            >
              <Input value={m.medicationName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { medicationName: e.target.value })} placeholder="Medication name" />
              <Input value={m.dosage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { dosage: e.target.value })} placeholder="Dosage (e.g. 500mg)" />
              <button
                onClick={() => setItems((all) => all.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--critical-red)', cursor: 'pointer', gridRow: '1 / 3' }}
              >
                <Trash2 size={16} />
              </button>
              <Input
                value={m.schedule}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { schedule: e.target.value })}
                placeholder="Schedule (e.g. Twice daily)"
              />
              <Input value={m.notes ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { notes: e.target.value })} placeholder="Notes" />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setItems((all) => [...all, { medicationName: '', dosage: '', schedule: '', notes: '' }])}
          >
            <Plus size={14} /> Add medication
          </Button>
        </div>
      )}
      <Button onClick={save} loading={saving}>
        <Save size={15} /> Save
      </Button>
    </Card>
  )
}

// ---------------- Surgeries ----------------

function SurgeriesTab({ dash, onSaved }: { dash: MedicalProfileDashboard; onSaved: () => Promise<void> }) {
  const toast = useToast()
  const [hasSurgeries, setHasSurgeries] = useState(dash.sections.surgeries.hasSurgeriesFlag)
  const [items, setItems] = useState<Surgery[]>(dash.sections.surgeries.items)
  const [saving, setSaving] = useState(false)

  function update(i: number, patch: Partial<Surgery>) {
    setItems((all) => all.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  async function save() {
    setSaving(true)
    try {
      await api.medical.updateSurgeries(hasSurgeries, items)
      await onSaved()
      toast.push('success', 'Surgical history updated')
    } catch (err) {
      toast.push('error', 'Update failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Surgical history" action={<YesNoToggle value={hasSurgeries} onChange={setHasSurgeries} />} />
      {hasSurgeries && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {items.map((s, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border-hairline)',
                borderRadius: 12,
                padding: 14,
                display: 'grid',
                gridTemplateColumns: '1fr 160px 32px',
                gap: 10,
              }}
            >
              <Input value={s.surgeryName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { surgeryName: e.target.value })} placeholder="Surgery name" />
              <Input type="date" value={s.surgeryDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { surgeryDate: e.target.value })} />
              <button
                onClick={() => setItems((all) => all.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--critical-red)', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
              <Input
                value={s.notes ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, { notes: e.target.value })}
                placeholder="Notes"
                style={{ gridColumn: '1 / 3' }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setItems((all) => [...all, { surgeryName: '', surgeryDate: '', notes: '' }])}
          >
            <Plus size={14} /> Add surgery
          </Button>
        </div>
      )}
      <Button onClick={save} loading={saving}>
        <Save size={15} /> Save
      </Button>
    </Card>
  )
}

// ---------------- Emergency instructions ----------------

function InstructionsTab() {
  const toast = useToast()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await api.medical.updateEmergencyInstructions(text)
      toast.push('success', 'Emergency instructions saved')
    } catch (err) {
      toast.push('error', 'Update failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Emergency instructions" subtitle="Free-text notes shown directly to responders on scan." />
      <Textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Check blood glucose immediately if unconscious. Glucagon pen in bag side pocket."
      />
      <div style={{ marginTop: 14 }}>
        <Button onClick={save} loading={saving}>
          <Save size={15} /> Save
        </Button>
      </div>
    </Card>
  )
}

function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={() => onChange(true)}
        className={cls(value && 'active')}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          border: '1px solid var(--border-hairline-strong)',
          background: value ? 'var(--critical-red-dim)' : 'transparent',
          color: value ? 'var(--critical-red)' : 'var(--text-secondary)',
        }}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          border: '1px solid var(--border-hairline-strong)',
          background: !value ? 'var(--vital-green-dim)' : 'transparent',
          color: !value ? 'var(--vital-green)' : 'var(--text-secondary)',
        }}
      >
        No
      </button>
    </div>
  )
}
