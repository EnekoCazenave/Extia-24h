import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { BlockTypeLiteral } from '@extia-gaming/shared'
import { api } from '../../services/api.ts'
import styles from './AssociationsPanel.module.css'

interface Props {
  type: BlockTypeLiteral
  initialContent?: Record<string, unknown>
  onSave: (content: Record<string, unknown>) => void | Promise<void>
  onCancel: () => void
  busy?: boolean
}

type FormState = Record<string, string | number | boolean | undefined>

function initFor(type: BlockTypeLiteral, initial?: Record<string, unknown>): FormState {
  if (initial) {
    const out: FormState = {}
    for (const [k, v] of Object.entries(initial)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v
    }
    return out
  }
  switch (type) {
    case 'HEADING':
      return { text: '', level: 2 }
    case 'TEXT':
      return { html: '' }
    case 'IMAGE':
      return { url: '', alt: '', caption: '' }
    case 'VIDEO':
      return { url: '', provider: 'youtube' }
    case 'CTA_BUTTON':
      return { label: '', url: '', style: 'primary' }
    case 'PROGRESS_BAR':
      return { current: 0, goal: 100, label: '', unit: '' }
    case 'DONATION_LINK':
      return { label: '', url: '' }
    case 'QUOTE':
      return { text: '', author: '' }
  }
}

function buildContent(type: BlockTypeLiteral, form: FormState): Record<string, unknown> {
  switch (type) {
    case 'HEADING':
      return { text: String(form.text ?? ''), level: Number(form.level ?? 2) }
    case 'TEXT':
      return { html: String(form.html ?? '') }
    case 'IMAGE': {
      const out: Record<string, unknown> = { url: String(form.url ?? ''), alt: String(form.alt ?? '') }
      if (form.caption) out.caption = String(form.caption)
      return out
    }
    case 'VIDEO':
      return { url: String(form.url ?? ''), provider: String(form.provider ?? 'youtube') }
    case 'CTA_BUTTON':
      return {
        label: String(form.label ?? ''),
        url: String(form.url ?? ''),
        style: String(form.style ?? 'primary'),
      }
    case 'PROGRESS_BAR': {
      const out: Record<string, unknown> = {
        current: Number(form.current ?? 0),
        goal: Number(form.goal ?? 1),
      }
      if (form.label) out.label = String(form.label)
      if (form.unit) out.unit = String(form.unit)
      return out
    }
    case 'DONATION_LINK':
      return { label: String(form.label ?? ''), url: String(form.url ?? '') }
    case 'QUOTE': {
      const out: Record<string, unknown> = { text: String(form.text ?? '') }
      if (form.author) out.author = String(form.author)
      return out
    }
  }
}

export function BlockEditor({ type, initialContent, onSave, onCancel, busy }: Props) {
  const [form, setForm] = useState<FormState>(() => initFor(type, initialContent))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post<{ url: string }>('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set('url', res.data.url)
    } catch {
      setError('Upload impossible.')
    } finally {
      setUploading(false)
    }
  }

  function handleVideoUrl(e: ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    set('url', url)
    if (url.includes('youtube.com') || url.includes('youtu.be')) set('provider', 'youtube')
    else if (url.includes('twitch.tv')) set('provider', 'twitch')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    try {
      await onSave(buildContent(type, form))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
    }
  }

  return (
    <form className={styles.blockEditor} onSubmit={handleSubmit}>
      <h4 className={styles.blockEditorTitle}>Bloc : {type}</h4>

      {type === 'HEADING' && (
        <>
          <label className={styles.label}>
            Texte
            <input
              className={styles.input}
              value={String(form.text ?? '')}
              onChange={(e) => set('text', e.target.value)}
              required
              maxLength={500}
            />
          </label>
          <label className={styles.label}>
            Niveau
            <select
              className={styles.select}
              value={String(form.level ?? 2)}
              onChange={(e) => set('level', parseInt(e.target.value, 10))}
            >
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
            </select>
          </label>
        </>
      )}

      {type === 'TEXT' && (
        <label className={styles.label}>
          HTML
          <textarea
            className={styles.textarea}
            value={String(form.html ?? '')}
            onChange={(e) => set('html', e.target.value)}
            rows={8}
            required
            maxLength={50000}
            placeholder="<p>Votre contenu…</p>"
          />
        </label>
      )}

      {type === 'IMAGE' && (
        <>
          <label className={styles.label}>
            Fichier image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          <label className={styles.label}>
            URL (remplie automatiquement après upload)
            <input
              className={styles.input}
              value={String(form.url ?? '')}
              onChange={(e) => set('url', e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Alt
            <input
              className={styles.input}
              value={String(form.alt ?? '')}
              onChange={(e) => set('alt', e.target.value)}
              maxLength={500}
            />
          </label>
          <label className={styles.label}>
            Légende (optionnel)
            <input
              className={styles.input}
              value={String(form.caption ?? '')}
              onChange={(e) => set('caption', e.target.value)}
              maxLength={500}
            />
          </label>
        </>
      )}

      {type === 'VIDEO' && (
        <>
          <label className={styles.label}>
            URL
            <input
              className={styles.input}
              type="url"
              value={String(form.url ?? '')}
              onChange={handleVideoUrl}
              required
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </label>
          <label className={styles.label}>
            Source
            <select
              className={styles.select}
              value={String(form.provider ?? 'youtube')}
              onChange={(e) => set('provider', e.target.value)}
            >
              <option value="youtube">YouTube</option>
              <option value="twitch">Twitch</option>
              <option value="custom">Fichier direct</option>
            </select>
          </label>
        </>
      )}

      {type === 'CTA_BUTTON' && (
        <>
          <label className={styles.label}>
            Libellé
            <input
              className={styles.input}
              value={String(form.label ?? '')}
              onChange={(e) => set('label', e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className={styles.label}>
            URL
            <input
              className={styles.input}
              type="url"
              value={String(form.url ?? '')}
              onChange={(e) => set('url', e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Style
            <select
              className={styles.select}
              value={String(form.style ?? 'primary')}
              onChange={(e) => set('style', e.target.value)}
            >
              <option value="primary">Principal</option>
              <option value="secondary">Secondaire</option>
            </select>
          </label>
        </>
      )}

      {type === 'PROGRESS_BAR' && (
        <>
          <label className={styles.label}>
            Valeur actuelle
            <input
              className={styles.input}
              type="number"
              min="0"
              value={Number(form.current ?? 0)}
              onChange={(e) => set('current', parseFloat(e.target.value))}
              required
            />
          </label>
          <label className={styles.label}>
            Objectif
            <input
              className={styles.input}
              type="number"
              min="1"
              value={Number(form.goal ?? 1)}
              onChange={(e) => set('goal', parseFloat(e.target.value))}
              required
            />
          </label>
          <label className={styles.label}>
            Label (optionnel)
            <input
              className={styles.input}
              value={String(form.label ?? '')}
              onChange={(e) => set('label', e.target.value)}
              maxLength={200}
            />
          </label>
          <label className={styles.label}>
            Unité (optionnel)
            <input
              className={styles.input}
              value={String(form.unit ?? '')}
              onChange={(e) => set('unit', e.target.value)}
              maxLength={20}
              placeholder="€"
            />
          </label>
        </>
      )}

      {type === 'DONATION_LINK' && (
        <>
          <label className={styles.label}>
            Libellé
            <input
              className={styles.input}
              value={String(form.label ?? '')}
              onChange={(e) => set('label', e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className={styles.label}>
            URL
            <input
              className={styles.input}
              type="url"
              value={String(form.url ?? '')}
              onChange={(e) => set('url', e.target.value)}
              required
            />
          </label>
        </>
      )}

      {type === 'QUOTE' && (
        <>
          <label className={styles.label}>
            Citation
            <textarea
              className={styles.textarea}
              value={String(form.text ?? '')}
              onChange={(e) => set('text', e.target.value)}
              rows={4}
              required
              maxLength={2000}
            />
          </label>
          <label className={styles.label}>
            Auteur (optionnel)
            <input
              className={styles.input}
              value={String(form.author ?? '')}
              onChange={(e) => set('author', e.target.value)}
              maxLength={200}
            />
          </label>
        </>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.editorActions}>
        <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={busy || uploading}>
          {busy ? 'Enregistrement…' : uploading ? 'Upload…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
