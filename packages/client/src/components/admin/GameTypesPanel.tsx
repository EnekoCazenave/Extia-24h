import { useState } from 'react'
import { useGames } from '../../hooks/useGames.ts'
import { useAddGameType, useUpdateGameType, useDeleteGameType } from '../../hooks/useAdmin.ts'
import type { CalculConfig } from '@extia-gaming/shared'
import Modal from '../Modal.tsx'
import GameTypeForm, { type GameTypeFormValues } from './GameTypeForm.tsx'
import styles from '../../pages/AdminPage.module.css'

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; gameTypeId: number; videoGameId: number }

function calculLabel(cfg: CalculConfig): string {
  if (cfg.type === 'BOOLEAN') return `Booléen (${cfg.trueValue}/${cfg.falseValue})`
  if (cfg.type === 'NUMBER') return `Nombre ×${cfg.multiplier}`
  return `Temps — ${cfg.tiers.length} palier${cfg.tiers.length > 1 ? 's' : ''}`
}

export default function GameTypesPanel() {
  const { data: games } = useGames()
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [createGameId, setCreateGameId] = useState<number>(0)
  const addGameType = useAddGameType(createGameId)
  const updateGameType = useUpdateGameType()
  const deleteGameType = useDeleteGameType()

  const editing = mode.kind === 'edit'
    ? games?.find((g) => g.id === mode.videoGameId)?.gameTypes.find((t) => t.id === mode.gameTypeId)
    : undefined

  async function handleCreate(values: GameTypeFormValues) {
    if (!createGameId) return
    await addGameType.mutateAsync(values)
    setMode({ kind: 'closed' })
    setCreateGameId(0)
  }

  async function handleUpdate(values: GameTypeFormValues) {
    if (mode.kind !== 'edit') return
    await updateGameType.mutateAsync({ gameTypeId: mode.gameTypeId, data: values })
    setMode({ kind: 'closed' })
  }

  async function handleDelete(gameTypeId: number, name: string) {
    if (!confirm(`Supprimer le mode "${name}" ?`)) return
    try {
      await deleteGameType.mutateAsync(gameTypeId)
    } catch {
      alert('Suppression impossible. Le mode a peut-être des parties associées.')
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Types de partie</h2>
        <button type="button" className={styles.addBtn} onClick={() => setMode({ kind: 'create' })}>
          + Ajouter
        </button>
      </div>
      {!games || games.length === 0 ? (
        <p className={styles.empty}>Aucun jeu disponible. Créez un jeu d'abord.</p>
      ) : (
        <div className={styles.list}>
          {games.map((g) => (
            <div key={g.id} className={styles.gameGroup}>
              <div className={styles.gameGroupHeader}>
                <div className={styles.gameGroupTitle}>🎮 {g.nom}</div>
              </div>
              {g.gameTypes.length === 0 ? (
                <p className={styles.empty} style={{ padding: '8px 0' }}>Aucun mode.</p>
              ) : (
                <div className={styles.subList}>
                  {g.gameTypes.map((gt) => (
                    <div key={gt.id} className={styles.listItem}>
                      <div className={styles.listInfo}>
                        <div className={styles.listTitle}>
                          {gt.name}
                          {gt.team && <span style={{ marginLeft: 8, fontSize: '0.75em', color: 'var(--color-accent)' }}>(équipe)</span>}
                        </div>
                        <div className={styles.listMeta}>
                          {calculLabel(gt.calculConfig)} • Victoire : {gt.win}
                        </div>
                      </div>
                      <div className={styles.listActions}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => setMode({ kind: 'edit', gameTypeId: gt.id, videoGameId: g.id })}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(gt.id, gt.name)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={mode.kind === 'create'}
        title="Ajouter un type de partie"
        onClose={() => { setMode({ kind: 'closed' }); setCreateGameId(0) }}
      >
        <GameTypeForm
          submitLabel="+ Ajouter le type"
          pendingLabel="Ajout…"
          isPending={addGameType.isPending}
          onSubmit={handleCreate}
          showGameSelect
          gameOptions={games ?? []}
          selectedGameId={createGameId}
          onGameChange={setCreateGameId}
        />
      </Modal>

      <Modal
        open={mode.kind === 'edit'}
        title={`Modifier ${editing?.name ?? ''}`}
        onClose={() => setMode({ kind: 'closed' })}
      >
        {editing && (
          <GameTypeForm
            initialValues={{
              name: editing.name,
              win: editing.win,
              team: editing.team,
              calculConfig: editing.calculConfig,
            }}
            submitLabel="Enregistrer"
            pendingLabel="Enregistrement…"
            isPending={updateGameType.isPending}
            onSubmit={handleUpdate}
          />
        )}
      </Modal>
    </div>
  )
}
