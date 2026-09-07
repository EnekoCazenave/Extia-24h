import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import { useAssociations } from '../hooks/useAssociations.ts'
import { BlockRenderer } from '../components/blocks/BlockRenderer.tsx'
import styles from './AssociationsPage.module.css'

export default function AssociationsPage() {
  const { data: associations, isLoading, isError } = useAssociations()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSlug = searchParams.get('asso') ?? ''

  const selected = useMemo(() => {
    if (!associations || associations.length === 0) return undefined
    const match = associations.find((a) => a.slug === activeSlug)
    return match ?? associations[0]
  }, [associations, activeSlug])

  useEffect(() => {
    if (selected && selected.slug !== activeSlug) {
      setSearchParams({ asso: selected.slug }, { replace: true })
    }
  }, [selected, activeSlug, setSearchParams])

  function handleSelect(slug: string) {
    setSearchParams({ asso: slug })
  }

  return (
    <div className={styles.page}>
      <SEOHead
        title="Associations caritatives"
        description="Les associations caritatives soutenues par l'événement Extia Gaming 24h."
        canonicalPath="/associations"
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Associations caritatives</h1>
        <p className={styles.subtitle}>
          L'intégralité de la collecte soutient les associations partenaires de l'Extia Gaming 24h.
        </p>
      </div>

      {isLoading && <p className={styles.state}>Chargement…</p>}
      {isError && <p className={styles.stateError}>Impossible de charger les associations.</p>}

      {associations && associations.length === 0 && (
        <div className={styles.empty}>
          <h2>Bientôt</h2>
          <p>Les associations partenaires seront annoncées prochainement.</p>
        </div>
      )}

      {associations && associations.length > 0 && selected && (
        <>
          <div className={styles.tabs} role="tablist" aria-label="Associations">
            {associations.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={a.slug === selected.slug}
                className={`${styles.tab} ${a.slug === selected.slug ? styles.tabActive : ''}`}
                onClick={() => handleSelect(a.slug)}
              >
                {a.logoUrl ? (
                  <img className={styles.tabLogo} src={a.logoUrl} alt="" />
                ) : null}
                <span>{a.name}</span>
              </button>
            ))}
          </div>

          <div className={styles.content} role="tabpanel">
            {selected.blocks.length === 0 ? (
              <p className={styles.state}>Contenu en préparation.</p>
            ) : (
              selected.blocks.map((b) => <BlockRenderer key={b.id} block={b} />)
            )}
          </div>
        </>
      )}
    </div>
  )
}
