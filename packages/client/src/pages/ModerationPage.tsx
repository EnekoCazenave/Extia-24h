import {usePlatform,type PublicSettings} from '../hooks/usePlatform.ts'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import ScoringDetails from '../components/ScoringDetails.tsx'
import SEOHead from '../components/SEOHead.tsx'
import { useModerationSessions, useApproveSession, useRejectSession, useDeleteAllSessions } from '../hooks/useModeration.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useGames } from '../hooks/useGames.ts'
import type { ModerationSession } from '../hooks/useModeration.ts'
import styles from './ModerationPage.module.css'

function ProofImage({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const src = url.startsWith('http') ? url : url

  return (
    <>
      <button type="button" className={styles.proofThumbBtn} onClick={() => setOpen(true)} aria-label="Agrandir la preuve">
        <img src={src} alt="Preuve" className={styles.proofThumb} />
      </button>
      {open && (
        <div className={styles.lightboxOverlay} onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Preuve agrandie">
          <img src={src} alt="Preuve agrandie" className={styles.lightboxImg} onClick={(e) => e.stopPropagation()} />
          <button type="button" className={styles.lightboxClose} onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
        </div>
      )}
    </>
  )
}

function SessionCard({ session, onApprove, onReject, approving, rejecting, disabled, proofRequired }: {
  session: ModerationSession
  onApprove: () => void
  onReject: () => void
  approving: boolean
  rejecting: boolean
  disabled: boolean
  proofRequired: boolean
}) {
  const date = new Date(session.createdAt).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span className={styles.gameLabel}>{session.gameType.videoGame.nom}</span>
          <span className={styles.typeBadge}>{session.gameType.name}{session.gameType.team ? ' · équipe' : ''}</span>
        </div>
        <span className={styles.date}>{date}</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Joueur</span>
            <span className={styles.infoValue}>
              {session.submitter.firstname} {session.submitter.lastname}
              <span className={styles.login}> ({session.submitter.login})</span>
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Score calculé avant plafonds (total du groupe)</span>
            <span className={styles.infoValue}>{session.score.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} pts</span>
          </div>
          {session.userGames?.length ? <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Points crédités (total du groupe)</span>
            <span className={styles.infoValue}>{session.userGames.reduce((sum, award) => sum + award.score, 0).toLocaleString('fr-FR', { maximumFractionDigits: 6 })} pts</span>
          </div> : null}
          {session.teamMembers.length > 0 && (
            <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.infoLabel}>Membres d'équipe</span>
              <div className={styles.teamChips}>
                {session.teamMembers.map((m) => (
                  <span key={m.userId} className={styles.chip}>
                    {m.user.firstname} {m.user.lastname}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <ScoringDetails data={session.scoringData} participants={[session.submitter, ...session.teamMembers.map(m => ({ id: m.userId, login: m.user.login }))]} awarded={session.userGames} />
        {session.proofUrl && (
          <div className={styles.proofSection}>
            <span className={styles.infoLabel}>Preuve</span>
            <ProofImage url={session.proofUrl} />
          </div>
        )}
      </div>

      {session.status !== 'REJECTED' && (
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.rejectBtn}
            onClick={onReject}
            disabled={disabled || approving || rejecting}
          >
            {rejecting ? 'Rejet…' : '✕ Rejeter'}
          </button>
          {session.status === 'PENDING' && proofRequired&&!session.proofUrl&&<p>Une capture d’écran est nécessaire pour valider cette déclaration.</p>}
          {session.status === 'PENDING' && <button
            type="button"
            className={styles.approveBtn}
            onClick={onApprove}
            disabled={disabled || approving || rejecting || (proofRequired&&!session.proofUrl)}
          >
            {approving ? 'Validation…' : '✓ Valider'}
          </button>}
        </div>
      )}
      {session.status !== 'PENDING' && (
        <div className={session.status === 'APPROVED' ? styles.statusApproved : styles.statusRejected}>
          {session.status === 'APPROVED' ? '✓ Validée' : '✕ Rejetée'}
        </div>
      )}
    </div>
  )
}

export default function ModerationPage() {
  const { user } = useAuth()
  const games = useGames()
  const settings=usePlatform<{settings:PublicSettings}>('/api/settings')
  const [filterGameId, setFilterGameId] = useState<number | undefined>()
  const [filterStatus, setFilterStatus] = useState('APPROVED')

  const sessions = useModerationSessions(filterGameId, filterStatus)
  const approve = useApproveSession()
  const reject = useRejectSession()
  const deleteAll = useDeleteAllSessions()
  const moderationError = approve.error ?? reject.error

  return (
    <div className={styles.page}>
      <SEOHead
        title="Modération — Extia Gaming 24h"
        description="Validation des parties déclarées."
        canonicalPath="/moderation"
      />
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Modération des parties</h1>
          {user?.role.id === 2 && (
            <button
              type="button"
              className={styles.rejectBtn}
              disabled={deleteAll.isPending || approve.isPending || reject.isPending}
              onClick={() => {
                if (confirm('Supprimer définitivement toutes les parties (en attente, validées et rejetées), pour tous les jeux, ainsi que les points associés ? Cette action est irréversible.')) deleteAll.mutate()
              }}
            >
              {deleteAll.isPending ? 'Suppression…' : 'Supprimer toutes les parties'}
            </button>
          )}
        </div>
        <p className={styles.subtitle}>Les nouvelles parties sont validées automatiquement. Rejetez une partie pour retirer ses points à tous les participants.</p>
      </div>

      {deleteAll.isSuccess && <p role="status">Toutes les parties et leurs points associés ont été supprimés.</p>}
      {deleteAll.isError && <p className={styles.stateError} role="alert">Impossible de supprimer les parties. Veuillez réessayer.</p>}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-game">Jeu</label>
          <select
            id="filter-game"
            className={styles.filterSelect}
            value={filterGameId ?? ''}
            onChange={(e) => setFilterGameId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          >
            <option value="">Tous les jeux</option>
            {games.data?.map((g) => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-status">Statut</label>
          <select
            id="filter-status"
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Validées</option>
            <option value="REJECTED">Rejetées</option>
          </select>
        </div>
      </div>

      {(approve.isError || reject.isError) && <p role="alert">{isAxiosError(moderationError) ? moderationError.response?.data?.error ?? "Validation impossible." : "Validation impossible."}</p>}
      {sessions.isLoading && (
        <p className={styles.state} aria-live="polite">Chargement…</p>
      )}
      {sessions.isError && (
        <p className={styles.stateError} role="alert">Impossible de charger les sessions.</p>
      )}
      {sessions.data && sessions.data.length === 0 && (
        <div className={styles.empty}>
          <p>Aucune partie {filterStatus === 'PENDING' ? 'en attente' : filterStatus === 'APPROVED' ? 'validée' : 'rejetée'}.</p>
        </div>
      )}
      {sessions.data && sessions.data.length > 0 && (
        <div className={styles.list}>
          {sessions.data.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onApprove={() => approve.mutate(s.id)}
              onReject={() => { if(s.status !== 'APPROVED' || confirm('Rejeter cette partie et retirer ses points à tous les participants ?')) reject.mutate(s.id) }}
              approving={approve.isPending && approve.variables === s.id}
              rejecting={reject.isPending && reject.variables === s.id}
              disabled={deleteAll.isPending}
              proofRequired={settings.data?.settings.proofRequired??false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
