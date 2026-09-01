import { useState, type FormEvent, type ChangeEvent } from 'react'
import { api } from '../../services/api.ts'
import styles from '../../pages/AdminPage.module.css'

export interface GameFormValues {
  nom: string
  imageUrl?: string | null
  happyHourStart?: string | null
  happyHourEnd?: string | null
}

interface GameFormProps {
  initialValues?: Partial<GameFormValues>
  submitLabel: string
  pendingLabel: string
  onSubmit: (values: GameFormValues) => Promise<void>
  isPending: boolean
}

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function GameForm({ initialValues, submitLabel, pendingLabel, onSubmit, isPending }: GameFormProps) {
  const [nom, setNom] = useState(initialValues?.nom ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialValues?.imageUrl ?? null)
  const [happyHourStart, setHappyHourStart] = useState(toLocalInputValue(initialValues?.happyHourStart))
  const [happyHourEnd, setHappyHourEnd] = useState(toLocalInputValue(initialValues?.happyHourEnd))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : (initialValues?.imageUrl ?? null))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    try {
      let imageUrl: string | undefined | null = initialValues?.imageUrl
      if (imageFile) {
        setUploading(true)
        const form = new FormData()
        form.append('file', imageFile)
        const res = await api.post<{ url: string }>('/api/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = res.data.url
        setUploading(false)
      }
      await onSubmit({
        nom,
        imageUrl: imageUrl ?? undefined,
        happyHourStart: happyHourStart ? new Date(happyHourStart).toISOString() : null,
        happyHourEnd: happyHourEnd ? new Date(happyHourEnd).toISOString() : null,
      })
    } catch {
      setUploading(false)
      setError('Erreur lors de la soumission.')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gf-nom">Nom du jeu *</label>
        <input
          className={styles.input}
          id="gf-nom"
          type="text"
          required
          maxLength={100}
          placeholder="ex: Rocket League"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gf-image">Image du jeu</label>
        <input
          className={styles.fileInput}
          id="gf-image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <img src={imagePreview} alt="Aperçu" className={styles.imgPreview} />
        )}
        <span className={styles.hint}>Laisser vide pour conserver l'image actuelle.</span>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gf-hh-start">Happy Hour — début</label>
          <input
            className={styles.input}
            id="gf-hh-start"
            type="datetime-local"
            value={happyHourStart}
            onChange={(e) => setHappyHourStart(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gf-hh-end">Happy Hour — fin</label>
          <input
            className={styles.input}
            id="gf-hh-end"
            type="datetime-local"
            value={happyHourEnd}
            onChange={(e) => setHappyHourEnd(e.target.value)}
          />
        </div>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.submitBtn} disabled={isPending || uploading}>
        {uploading ? 'Upload…' : isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  )
}
