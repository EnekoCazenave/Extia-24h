import { useSyncExternalStore, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './ExternalMedia.module.css'

type Provider = 'YouTube' | 'Twitch'
type Choice = 'allowed' | 'refused' | undefined
let choices: Partial<Record<Provider, Choice>> = {}
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

// eslint-disable-next-line react-refresh/only-export-components
export function setMediaChoice(provider: Provider, choice: Choice) {
  choices = { ...choices, [provider]: choice }
  listeners.forEach(listener => listener())
}

function useChoice(provider: Provider) {
  return useSyncExternalStore(subscribe, () => choices[provider], () => undefined)
}

export function ExternalMedia({ provider, children }: { provider: Provider; children: ReactNode }) {
  const choice = useChoice(provider)
  if (choice === 'allowed') return children
  return <div className={styles.placeholder}>
    <p>Ce contenu {provider} est bloqué. Son activation autorise les traceurs de {provider} pour la lecture et la mesure d’audience et transmet notamment votre adresse IP à ce service, avec des transferts possibles hors UE.</p>
    <p>Ce choix est indépendant des statistiques de l’événement. Vous pouvez le retirer via « Gérer les cookies » en bas de page. <Link to="/politique-de-confidentialite#cookies">En savoir plus</Link>.</p>
    <div className={styles.actions}>
      <button type="button" onClick={() => setMediaChoice(provider, 'allowed')}>Autoriser {provider}</button>
      {choice !== 'refused' && <button type="button" onClick={() => setMediaChoice(provider, 'refused')}>Refuser {provider}</button>}
      {choice === 'refused' && <span>Contenu refusé.</span>}
    </div>
  </div>
}

function ProviderPreference({ provider }: { provider: Provider }) {
  const choice = useChoice(provider)
  return <div className={styles.actions}>
    <span>{provider} : {choice === 'allowed' ? 'autorisé' : 'bloqué'}</span>
    <button type="button" onClick={() => setMediaChoice(provider, 'allowed')} disabled={choice === 'allowed'}>Autoriser {provider}</button>
    <button type="button" onClick={() => setMediaChoice(provider, 'refused')} disabled={choice === 'refused'}>{choice === 'allowed' ? `Retirer le consentement ${provider}` : `Refuser ${provider}`}</button>
  </div>
}

export function MediaPreferences() {
  return <details className={styles.preferences}>
    <summary>Gérer les cookies</summary>
    <p>Les cookies de connexion sont nécessaires. Les lecteurs YouTube et Twitch restent bloqués sans votre accord. Les choix sont conservés en mémoire jusqu’au rechargement de la page.</p>
    <ProviderPreference provider="YouTube" />
    <ProviderPreference provider="Twitch" />
  </details>
}
