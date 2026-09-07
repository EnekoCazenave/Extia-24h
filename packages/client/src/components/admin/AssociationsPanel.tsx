import { useState, type FormEvent, type ChangeEvent } from 'react'
import type { BlockTypeLiteral } from '@extia-gaming/shared'
import {
  useAdminAssociations,
  useAdminAssociation,
  useCreateAssociation,
  useUpdateAssociation,
  useDeleteAssociation,
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
  useReorderBlocks,
  type AdminAssociationSummary,
  type AssociationBlock,
} from '../../hooks/useAssociations.ts'
import { api } from '../../services/api.ts'
import { BlockEditor } from './BlockEditor.tsx'
import styles from './AssociationsPanel.module.css'

const BLOCK_TYPES: BlockTypeLiteral[] = [
  'HEADING',
  'TEXT',
  'IMAGE',
  'VIDEO',
  'CTA_BUTTON',
  'PROGRESS_BAR',
  'DONATION_LINK',
  'QUOTE',
]

function blockPreview(block: AssociationBlock): string {
  const c = block.content as Record<string, unknown>
  switch (block.type) {
    case 'HEADING':
      return `H${c.level} — ${String(c.text ?? '')}`
    case 'TEXT':
      return String(c.html ?? '').replace(/<[^>]+>/g, '').slice(0, 80)
    case 'IMAGE':
      return `${String(c.url ?? '')} (${String(c.alt ?? '')})`
    case 'VIDEO':
      return `${String(c.provider ?? '')} : ${String(c.url ?? '')}`
    case 'CTA_BUTTON':
      return `${String(c.label ?? '')} → ${String(c.url ?? '')}`
    case 'PROGRESS_BAR':
      return `${String(c.label ?? 'Objectif')} : ${String(c.current ?? 0)} / ${String(c.goal ?? 0)}`
    case 'DONATION_LINK':
      return `${String(c.label ?? '')} → ${String(c.url ?? '')}`
    case 'QUOTE':
      return String(c.text ?? '').slice(0, 80)
  }
}

function AssociationForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  busy,
}: {
  initial?: AdminAssociationSummary
  onSubmit: (data: { name: string; slug?: string; logoUrl?: string | null; published?: boolean }) => Promise<void>
  onCancel: () => void
  submitLabel: string
  busy?: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? '')
  const [published, setPublished] = useState(initial?.published ?? false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
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
      setLogoUrl(res.data.url)
    } catch {
      setError('Upload du logo impossible.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    try {
      await onSubmit({
        name,
        slug: slug || undefined,
        logoUrl: logoUrl || null,
        published,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        Nom *
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
        />
      </label>
      <label className={styles.label}>
        Slug (optionnel, auto-généré sinon)
        <input
          className={styles.input}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          maxLength={200}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="mon-association"
        />
      </label>
      <label className={styles.label}>
        Logo
        <input type="file" accept="image/*" onChange={handleLogoChange} disabled={uploading} />
        {logoUrl && (
          <input
            className={styles.input}
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        )}
      </label>
      <div className={styles.checkRow}>
        <input
          id="assoPublished"
          className={styles.checkbox}
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        <label htmlFor="assoPublished">Publiée</label>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}>
        <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={busy || uploading}>
          {busy ? 'Enregistrement…' : uploading ? 'Upload…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function ContentEditor({ associationId, onBack }: { associationId: number; onBack: () => void }) {
  const { data: association, isLoading } = useAdminAssociation(associationId)
  const createBlock = useCreateBlock(associationId)
  const updateBlock = useUpdateBlock(associationId)
  const deleteBlock = useDeleteBlock(associationId)
  const reorderBlocks = useReorderBlocks(associationId)

  const [addingType, setAddingType] = useState<BlockTypeLiteral | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className={styles.editorSubtitle}>Chargement…</p>
  if (!association) return <p className={styles.error}>Association introuvable.</p>

  async function moveBlock(index: number, direction: -1 | 1) {
    if (!association) return
    const next = index + direction
    if (next < 0 || next >= association.blocks.length) return
    const order = association.blocks.map((b) => b.id)
    ;[order[index], order[next]] = [order[next]!, order[index]!]
    await reorderBlocks.mutateAsync({ blockIds: order })
  }

  async function handleAddBlock(content: Record<string, unknown>) {
    if (!addingType) return
    setError(null)
    try {
      await createBlock.mutateAsync({ type: addingType, content })
      setAddingType(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur.'
      setError(msg)
      throw err
    }
  }

  async function handleUpdateBlock(blockId: number, content: Record<string, unknown>) {
    setError(null)
    try {
      await updateBlock.mutateAsync({ blockId, data: { content } })
      setEditingBlockId(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur.'
      setError(msg)
      throw err
    }
  }

  async function handleDeleteBlock(blockId: number) {
    if (!confirm('Supprimer ce bloc ?')) return
    await deleteBlock.mutateAsync(blockId)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.editorHeader}>
        <div>
          <h3 className={styles.editorTitle}>{association.name}</h3>
          <p className={styles.editorSubtitle}>
            {association.blocks.length} bloc(s) · {association.published ? 'Publiée' : 'Brouillon'}
          </p>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onBack}>
          ← Retour
        </button>
      </div>

      <div className={styles.blocksList}>
        {association.blocks.length === 0 && (
          <p className={styles.editorSubtitle}>Aucun bloc pour le moment.</p>
        )}
        {association.blocks.map((block, index) => (
          <div key={block.id}>
            <div className={styles.blockRow}>
              <span className={styles.blockBadge}>{block.type}</span>
              <span className={styles.blockPreview}>{blockPreview(block)}</span>
              <div className={styles.blockActions}>
                <button
                  type="button"
                  className={styles.btnSmall}
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0 || reorderBlocks.isPending}
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.btnSmall}
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === association.blocks.length - 1 || reorderBlocks.isPending}
                  aria-label="Descendre"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.btnSmall}
                  onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                >
                  Éditer
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => handleDeleteBlock(block.id)}
                  disabled={deleteBlock.isPending}
                >
                  Supprimer
                </button>
              </div>
            </div>
            {editingBlockId === block.id && (
              <BlockEditor
                type={block.type}
                initialContent={block.content}
                onSave={(c) => handleUpdateBlock(block.id, c)}
                onCancel={() => setEditingBlockId(null)}
                busy={updateBlock.isPending}
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {addingType ? (
        <BlockEditor
          type={addingType}
          onSave={handleAddBlock}
          onCancel={() => setAddingType(null)}
          busy={createBlock.isPending}
        />
      ) : (
        <div className={styles.addBlockBar}>
          <span className={styles.editorSubtitle}>Ajouter un bloc :</span>
          {BLOCK_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={styles.btnSmall}
              onClick={() => setAddingType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AssociationsPanel() {
  const { data: associations, isLoading, isError } = useAdminAssociations()
  const createAssociation = useCreateAssociation()
  const updateAssociation = useUpdateAssociation()
  const deleteAssociation = useDeleteAssociation()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [contentEditingId, setContentEditingId] = useState<number | null>(null)

  async function handleCreate(data: { name: string; slug?: string; logoUrl?: string | null; published?: boolean }) {
    await createAssociation.mutateAsync({
      name: data.name,
      slug: data.slug,
      logoUrl: data.logoUrl ?? undefined,
      published: data.published,
    })
    setCreating(false)
  }

  async function handleUpdate(id: number, data: { name: string; slug?: string; logoUrl?: string | null; published?: boolean }) {
    await updateAssociation.mutateAsync({ id, data })
    setEditingId(null)
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer "${name}" et tous ses blocs ?`)) return
    await deleteAssociation.mutateAsync(id)
  }

  async function togglePublish(assoc: AdminAssociationSummary) {
    await updateAssociation.mutateAsync({ id: assoc.id, data: { published: !assoc.published } })
  }

  async function moveAssociation(index: number, direction: -1 | 1) {
    if (!associations) return
    const next = index + direction
    if (next < 0 || next >= associations.length) return
    const a = associations[index]!
    const b = associations[next]!
    await Promise.all([
      updateAssociation.mutateAsync({ id: a.id, data: { sortOrder: b.sortOrder } }),
      updateAssociation.mutateAsync({ id: b.id, data: { sortOrder: a.sortOrder } }),
    ])
  }

  if (contentEditingId !== null) {
    return <ContentEditor associationId={contentEditingId} onBack={() => setContentEditingId(null)} />
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Associations</h2>
        {!creating && (
          <button type="button" className={styles.btnPrimary} onClick={() => setCreating(true)}>
            + Créer une association
          </button>
        )}
      </div>

      {creating && (
        <AssociationForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Créer"
          busy={createAssociation.isPending}
        />
      )}

      {isLoading && <p>Chargement…</p>}
      {isError && <p className={styles.error}>Erreur de chargement.</p>}

      {associations && associations.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Statut</th>
              <th>Blocs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {associations.map((a, i) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td><code>{a.slug}</code></td>
                <td>
                  <span className={a.published ? styles.statusPublished : styles.statusDraft}>
                    {a.published ? 'Publiée' : 'Brouillon'}
                  </span>
                </td>
                <td>{a._count.blocks}</td>
                <td>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => moveAssociation(i, -1)}
                      disabled={i === 0}
                      aria-label="Monter"
                    >↑</button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => moveAssociation(i, 1)}
                      disabled={i === associations.length - 1}
                      aria-label="Descendre"
                    >↓</button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => setContentEditingId(a.id)}
                    >
                      Contenu
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => togglePublish(a)}
                      disabled={updateAssociation.isPending}
                    >
                      {a.published ? 'Dépublier' : 'Publier'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleDelete(a.id, a.name)}
                    >
                      Suppr.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingId !== null && associations && (
        <AssociationForm
          initial={associations.find((a) => a.id === editingId)}
          onSubmit={(data) => handleUpdate(editingId, data)}
          onCancel={() => setEditingId(null)}
          submitLabel="Mettre à jour"
          busy={updateAssociation.isPending}
        />
      )}
    </div>
  )
}
