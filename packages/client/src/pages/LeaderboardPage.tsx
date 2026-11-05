import {GroupFilter, GroupsLeaderboard} from '../components/CommunityContent.tsx'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import SEOHead from '../components/SEOHead.tsx'
import { useFilteredLeaderboard } from '../hooks/useLeaderboard.ts'
import { useGames } from '../hooks/useGames.ts'
import type { VideoGame, GameType } from '@extia-gaming/shared'
import styles from './LeaderboardPage.module.css'

type TeamFilter = 'all' | 'solo' | 'team'

export default function LeaderboardPage() {
  const {user} = useAuth()
  const games = useGames()
  const [selectedGameId, setSelectedGameId] = useState<number | undefined>()
  const [selectedGameTypeId, setSelectedGameTypeId] = useState<number | undefined>()
  const [view, setView] = useState<'players' | 'groups'>('players')
  const [groupId, setGroupId] = useState<number | undefined>()
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all')

  const selectedGame: VideoGame | undefined = useMemo(
    () => games.data?.find((g) => g.id === selectedGameId),
    [games.data, selectedGameId],
  )

  const selectedGameType: GameType | undefined = useMemo(
    () => selectedGame?.gameTypes.find((t) => t.id === selectedGameTypeId),
    [selectedGame, selectedGameTypeId],
  )

  const teamParam = useMemo(() => {
    if (selectedGameType) return selectedGameType.team
    if (teamFilter === 'solo') return false
    if (teamFilter === 'team') return true
    return undefined
  }, [selectedGameType, teamFilter])

  const leaderboard = useFilteredLeaderboard({
    gameId: selectedGameId,
    gameTypeId: selectedGameTypeId,
    team: teamParam,
    groupId,
  })

  const hasScoreFilter = selectedGameId !== undefined || selectedGameTypeId !== undefined || teamFilter !== 'all'
  const isGlobal = selectedGameId === undefined && selectedGameTypeId === undefined && teamFilter === 'all' && groupId === undefined

  function handleGameChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value ? parseInt(e.target.value, 10) : undefined
    setSelectedGameId(val)
    setSelectedGameTypeId(undefined)
  }

  function handleGameTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value ? parseInt(e.target.value, 10) : undefined
    setSelectedGameTypeId(val)
  }

  function handleReset() {
    setSelectedGameId(undefined)
    setSelectedGameTypeId(undefined)
    setTeamFilter('all')
    setGroupId(undefined)
  }

  const hasActiveFilter = !isGlobal

  return (
    <div className={styles.page}>
      <SEOHead
        title="Classement — Extia Gaming 24h"
        description="Classement des joueurs de l'Extia Gaming 24h."
        canonicalPath="/classement"
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Classements</h1>
        <p className={styles.subtitle}>
          {!hasScoreFilter
            ? 'Score global tous jeux confondus (parties + bonus).'
            : 'Score filtré sur les parties validées.'}
        </p>
        {user && <Link className={styles.personalButton} to="/classement/me">Mon classement et mes parties</Link>}
      </div>

      <div className={`${styles.segmented} ${styles.viewTabs}`} role="group" aria-label="Classement affiché">
        <button type="button" className={`${styles.segBtn} ${view === 'players' ? styles.segBtnActive : ''}`} aria-pressed={view === 'players'} onClick={() => setView('players')}>Joueurs</button>
        <button type="button" className={`${styles.segBtn} ${view === 'groups' ? styles.segBtnActive : ''}`} aria-pressed={view === 'groups'} onClick={() => setView('groups')}>Agences et groupes</button>
      </div>
      {view === 'groups' ? <GroupsLeaderboard /> : <>
      <div className={styles.filtersBar}>
        <GroupFilter value={groupId} onChange={setGroupId} />
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="lb-game">Jeu</label>
          <select
            id="lb-game"
            className={styles.filterSelect}
            value={selectedGameId ?? ''}
            onChange={handleGameChange}
          >
            <option value="">Tous les jeux</option>
            {games.data?.map((g) => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>
        </div>

        {selectedGame && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="lb-type">Mode de jeu</label>
            <select
              id="lb-type"
              className={styles.filterSelect}
              value={selectedGameTypeId ?? ''}
              onChange={handleGameTypeChange}
            >
              <option value="">Tous les modes</option>
              {selectedGame.gameTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.team ? ' (équipe)' : ' (solo)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedGameType && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Format</span>
            <div className={styles.segmented} role="group" aria-label="Format de jeu">
              {(['all', 'solo', 'team'] as TeamFilter[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${styles.segBtn} ${teamFilter === v ? styles.segBtnActive : ''}`}
                  onClick={() => setTeamFilter(v)}
                >
                  {v === 'all' ? 'Tous' : v === 'solo' ? 'Solo' : 'Équipe'}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasActiveFilter && (
          <button type="button" className={styles.resetBtn} onClick={handleReset}>
            Réinitialiser
          </button>
        )}
      </div>

      {leaderboard.isLoading && (
        <p className={styles.state} aria-live="polite">Chargement…</p>
      )}
      {leaderboard.isError && (
        <p className={styles.stateError} role="alert">Impossible de charger le classement.</p>
      )}

      {leaderboard.data && leaderboard.data.length === 0 && (
        <div className={styles.empty}>
          <p>Aucun joueur classé pour ces critères.</p>
        </div>
      )}

      {leaderboard.data && leaderboard.data.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table} aria-label="Classement des joueurs">
            <thead>
              <tr>
                <th className={styles.rankCol} scope="col">#</th>
                <th scope="col">Joueur</th>
                <th scope="col">Score</th>
                {hasScoreFilter && <th scope="col">Parties</th>}
              </tr>
            </thead>
            <tbody>
              {leaderboard.data.map((entry) => (
                <tr key={entry.userId}>
                  <td className={styles.rankCol}>
                    <span
                      className={styles.rank}
                      data-rank={entry.rank <= 3 ? entry.rank : undefined}
                    >
                      {entry.rank}
                    </span>
                  </td>
                  <td>
                    <div className={styles.playerName}>{entry.login}</div>
                  </td>
                  <td>
                    <span className={styles.score}>{entry.totalScore.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} pts</span>
                  </td>
                  {hasScoreFilter && (
                    <td className={styles.gameCount}>
                      {'gameCount' in entry ? entry.gameCount : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>}
    </div>
  )
}
