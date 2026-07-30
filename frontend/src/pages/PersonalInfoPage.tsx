import { useEffect, useRef, useState } from 'react'
import { Camera, Save, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/EmptyState'
import { api, toApiError } from '@/api'
import type { Gender, PersonalInfo } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { initials } from '@/lib/format'

export default function PersonalInfoPage() {
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [info, setInfo] = useState<PersonalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    api.profile
      .getPersonalInfo()
      .then((d) => active && setInfo(d))
      .catch((err) => toast.push('error', 'Could not load personal info', toApiError(err).message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!info) return
    setSaving(true)
    try {
      await api.profile.updatePersonalInfo(info)
      updateUser({ username: info.name })
      toast.push('success', 'Personal info updated')
    } catch (err) {
      toast.push('error', 'Update failed', toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoBusy(true)
    try {
      const res = await api.account.uploadPhoto(file)
      const photoURL = (res.data as { photoURL?: string })?.photoURL ?? null
      updateUser({ photoURL: photoURL ?? null })
      toast.push('success', 'Photo updated')
    } catch (err) {
      toast.push('error', 'Photo upload failed', toApiError(err).message)
    } finally {
      setPhotoBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handlePhotoDelete() {
    setPhotoBusy(true)
    try {
      await api.account.deletePhoto()
      updateUser({ photoURL: null })
      toast.push('info', 'Photo removed')
    } catch (err) {
      toast.push('error', 'Could not remove photo', toApiError(err).message)
    } finally {
      setPhotoBusy(false)
    }
  }

  if (loading || !info) return <PageLoader label="Loading personal info…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Personal information</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          This is shown alongside your medical details when your LifeBand is scanned.
        </p>
      </div>

      <Card>
        <CardHeader title="Profile photo" subtitle="Optional, but helps responders confirm identity." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'var(--signal-cyan-dim)',
              color: 'var(--signal-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials(user?.username ?? 'U')
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
            <Button size="sm" variant="secondary" loading={photoBusy} onClick={() => fileRef.current?.click()}>
              <Camera size={14} /> Upload photo
            </Button>
            {user?.photoURL && (
              <Button size="sm" variant="danger" onClick={handlePhotoDelete} disabled={photoBusy}>
                <Trash2 size={14} /> Remove
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Basic details" />
        <form onSubmit={handleSave}>
          <Field label="Full name" required>
            <Input value={info.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInfo({ ...info, name: e.target.value })} required />
          </Field>
          <Field label="Gender">
            <Select
              value={info.gender ?? ''}
              onChange={(e) => setInfo({ ...info, gender: (e.target.value || null) as Gender | null })}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Address" hint="Shown to responders — helps confirm identity in an emergency.">
            <Input
              value={info.address ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInfo({ ...info, address: e.target.value || null })}
              placeholder="Street, city, country"
            />
          </Field>
          <Button type="submit" loading={saving}>
            <Save size={15} /> Save changes
          </Button>
        </form>
      </Card>
    </div>
  )
}
