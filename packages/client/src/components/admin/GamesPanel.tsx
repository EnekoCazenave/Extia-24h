import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api.ts'
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
  const qc = useQueryClient()
  const [dragged,setDragged] = useState<number|null>(null)
  const order = useMutation({mutationFn:async(gameIds:number[])=>api.put('/api/admin/games/order',{gameIds}),onSuccess:()=>{void qc.invalidateQueries({queryKey:['games']})}})
  function move(id:number,target:number) {
    if (!games || order.isPending || id === target) return
    const ids=games.map(g=>g.id),from=ids.indexOf(id),to=ids.indexOf(target)
    ids.splice(from,1); ids.splice(to,0,id); order.mutate(ids)
  }
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
      <p>Déplacez les jeux pour définir l’ordre commun, ou utilisez Monter / Descendre.</p>
      {order.isError && <p role="alert">Impossible d’enregistrer l’ordre. Rechargez la liste et réessayez.</p>}
      {order.isPending && <p role="status">Enregistrement de l’ordre…</p>}
      {!games || games.length === 0 ? (
        <p className={styles.empty}>Aucun jeu pour le moment.</p>
      ) : (
        <div className={styles.list}>
          {games.map((g,index) => {
            const hh = happyHourLabel(g.happyHourStart, g.happyHourEnd)
            return (
              <div key={g.id} className={styles.listItem} draggable={!order.isPending} onDragStart={e=>{setDragged(g.id);e.dataTransfer.setData('text/plain',String(g.id))}} onDragEnd={()=>setDragged(null)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragged!==null)move(dragged,g.id);setDragged(null)}}>
                {g.imageUrl && <img src={g.imageUrl} alt="" className={styles.listThumb} />}
                <div className={styles.listInfo}>
                  <div className={styles.listTitle}>{g.nom}</div>
                  <div className={styles.listMeta}>
                    {g.gameTypes.length} mode{g.gameTypes.length > 1 ? 's' : ''}
                    {hh && ` • ${hh}`}
                  </div>
                </div>
                <div className={styles.listActions}>
                  <button type="button" className={styles.editBtn} disabled={index===0||order.isPending} aria-label={`Monter ${g.nom}`} onClick={()=>move(g.id,games[index-1].id)}>Monter</button>
                  <button type="button" className={styles.editBtn} disabled={index===games.length-1||order.isPending} aria-label={`Descendre ${g.nom}`} onClick={()=>move(g.id,games[index+1].id)}>Descendre</button>
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
