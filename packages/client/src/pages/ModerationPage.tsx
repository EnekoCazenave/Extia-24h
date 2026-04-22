import { useState } from 'react'
import SEOHead from '../components/SEOHead.tsx'
import { useModerationSessions, useApproveSession, useRejectSession } from '../hooks/useModeration.ts'
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

function SessionCard({ session, onApprove, onReject, approving, rejecting }: {
  session: ModerationSession
  onApprove: () => void
  onReject: () => void
  approving: boolean
  rejecting: boolean
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
            <span className={styles.infoLabel}>Score déclaré</span>
            <span className={styles.infoValue}>{session.score.toLocaleString('fr-FR')} pts</span>
          </div>
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

        {session.proofUrl && (
          <div className={styles.proofSection}>
            <span className={styles.infoLabel}>Preuve</span>
            <ProofImage url={session.proofUrl} />
          </div>
        )}
      </div>

      {session.status === 'PENDING' && (
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.rejectBtn}
            onClick={onReject}
            disabled={approving || rejecting}
          >
            {rejecting ? 'Rejet…' : '✕ Rejeter'}
          </button>
          <button
            type="button"
            className={styles.approveBtn}
            onClick={onApprove}
            disabled={approving || rejecting}
          >
            {approving ? 'Validation…' : '✓ Valider'}
          </button>
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
  const games = useGames()
  const [filterGameId, setFilterGameId] = useState<number | undefined>()
  const [filterStatus, setFilterStatus] = useState('PENDING')

  const sessions = useModerationSessions(filterGameId, filterStatus)
  const approve = useApproveSession()
  const reject = useRejectSession()

  return (
    <div className={styles.page}>
      <SEOHead
        title="Modération — Extia Gaming 24h"
        description="Validation des parties déclarées."
        canonicalPath="/moderation"
      />
      <div className={styles.header}>
        <h1 className={styles.title}>Modération des parties</h1>
        <p className={styles.subtitle}>Validez ou rejetez les parties en attente.</p>
      </div>

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
              onReject={() => reject.mutate(s.id)}
              approving={approve.isPending && approve.variables === s.id}
              rejecting={reject.isPending && reject.variables === s.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
