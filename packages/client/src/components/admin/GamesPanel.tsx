import { useState } from 'react'
import { useGames } from '../../hooks/useGames.ts'
import { useCreateGame, useUpdateGame, useDeleteGame } from '../../hooks/useAdmin.ts'
import Modal from '../Modal.tsx'
import GameForm, { type GameFormValues } from './GameForm.tsx'
import styles from '../../pages/AdminPage.module.css'

type Mode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; gameId: number }

function happyHourLabel(start: string | null, end: string | null): string | null {
  if (!start || !end) return null
  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  return `Happy Hour : ${fmt(start)} → ${fmt(end)}`
}

export default function GamesPanel() {
  const { data: games } = useGames()
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const createGame = useCreateGame()
  const editingGameId = mode.kind === 'edit' ? mode.gameId : 0
  const updateGame = useUpdateGame(editingGameId)
  const deleteGame = useDeleteGame()
  const editing = mode.kind === 'edit' ? games?.find((g) => g.id === mode.gameId) : undefined

  async function handleCreate(values: GameFormValues) {
    await createGame.mutateAsync({
      nom: values.nom,
      imageUrl: values.imageUrl ?? undefined,
      happyHourStart: values.happyHourStart ?? undefined,
      happyHourEnd: values.happyHourEnd ?? undefined,
    })
    setMode({ kind: 'closed' })
  }

  async function handleUpdate(values: GameFormValues) {
    await updateGame.mutateAsync({
      nom: values.nom,
      imageUrl: values.imageUrl,
      happyHourStart: values.happyHourStart,
      happyHourEnd: values.happyHourEnd,
    })
    setMode({ kind: 'closed' })
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer le jeu "${name}" ? Cette action est irréversible.`)) return
    try {
      await deleteGame.mutateAsync(id)
    } catch {
      alert('Suppression impossible. Le jeu a peut-être des parties associées.')
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Jeux</h2>
        <button type="button" className={styles.addBtn} onClick={() => setMode({ kind: 'create' })}>
          + Ajouter
        </button>
      </div>
      {!games || games.length === 0 ? (
        <p className={styles.empty}>Aucun jeu pour le moment.</p>
      ) : (
        <div className={styles.list}>
          {games.map((g) => {
            const hh = happyHourLabel(g.happyHourStart, g.happyHourEnd)
            return (
              <div key={g.id} className={styles.listItem}>
                {g.imageUrl && <img src={g.imageUrl} alt="" className={styles.listThumb} />}
                <div className={styles.listInfo}>
                  <div className={styles.listTitle}>{g.nom}</div>
                  <div className={styles.listMeta}>
                    {g.gameTypes.length} mode{g.gameTypes.length > 1 ? 's' : ''}
                    {hh && ` • ${hh}`}
                  </div>
                </div>
                <div className={styles.listActions}>
                  <button type="button" className={styles.editBtn} onClick={() => setMode({ kind: 'edit', gameId: g.id })}>
                    Modifier
                  </button>
                  <button type="button" className={styles.deleteBtn} onClick={() => handleDelete(g.id, g.nom)}>
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={mode.kind === 'create'} title="Ajouter un jeu" onClose={() => setMode({ kind: 'closed' })}>
        <GameForm
          submitLabel="+ Créer le jeu"
          pendingLabel="Création…"
          isPending={createGame.isPending}
          onSubmit={handleCreate}
        />
      </Modal>

      <Modal open={mode.kind === 'edit'} title={`Modifier ${editing?.nom ?? ''}`} onClose={() => setMode({ kind: 'closed' })}>
        {editing && (
          <GameForm
            initialValues={{
              nom: editing.nom,
              imageUrl: editing.imageUrl,
              happyHourStart: editing.happyHourStart,
              happyHourEnd: editing.happyHourEnd,
            }}
            submitLabel="Enregistrer"
            pendingLabel="Enregistrement…"
            isPending={updateGame.isPending}
            onSubmit={handleUpdate}
          />
        )}
      </Modal>
    </div>
  )
}
