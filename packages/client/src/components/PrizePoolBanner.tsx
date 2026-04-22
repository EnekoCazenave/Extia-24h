import { useEffect, useRef, useState } from 'react'
import { useGames } from '../hooks/useGames.ts'
import styles from './PrizePoolBanner.module.css'

function useCountUp(target: number, durationMs = 1400): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>()
  const startRef = useRef<number>()
  const fromRef = useRef(0)

  useEffect(() => {
    fromRef.current = value
    startRef.current = undefined

    function tick(now: number) {
      if (startRef.current === undefined) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / durationMs)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(fromRef.current + (target - fromRef.current) * eased)
      setValue(next)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs])

  return value
}

export default function PrizePoolBanner() {
  const games = useGames({ refetchInterval: 60_000 })
  const total = games.data?.reduce((sum, g) => sum + g.totalScore, 0) ?? 0
  const animated = useCountUp(total)
  const formatted = animated.toLocaleString('fr-FR')
  const gameCount = games.data?.length ?? 0

  return (
    <section className={styles.banner} aria-labelledby="prize-pool-title">
      <div className={styles.inner}>
        <div className={styles.ribbon} aria-hidden="true">
          <span className={styles.ribbonDot} />
          Événement caritatif
        </div>

        <div className={styles.grid}>
          <div className={styles.intro}>
            <h2 id="prize-pool-title" className={styles.title}>
              Cagnotte solidaire
            </h2>
            <p className={styles.subtitle}>
              Chaque point marqué fait grandir la cagnotte reversée à l'association bénéficiaire.
              Plus vous jouez, plus vous donnez.
            </p>
          </div>

          <div className={styles.totalBlock} role="status" aria-live="polite">
            <span className={styles.totalLabel}>Total accumulé</span>
            <div className={styles.totalWrap}>
              <span className={styles.total}>{formatted}</span>
              <span className={styles.unit}>pts</span>
            </div>
            <span className={styles.totalFoot}>
              {games.isLoading
                ? 'Chargement…'
                : `réparti sur ${gameCount} ${gameCount > 1 ? 'jeux' : 'jeu'}`}
            </span>
          </div>
        </div>

        <div className={styles.glow} aria-hidden="true" />
      </div>
    </section>
  )
}
