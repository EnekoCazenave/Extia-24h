import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container} role="main">
          <div className={styles.icon} aria-hidden="true">💥</div>
          <h1 className={styles.title}>Une erreur est survenue</h1>
          <p className={styles.message}>
            Quelque chose s'est mal passé. L'équipe a été notifiée.
            {this.state.error?.message && (
              <><br /><code style={{ fontSize: '0.75rem', opacity: 0.6 }}>{this.state.error.message}</code></>
            )}
          </p>
          <div className={styles.actions}>
            <button className={styles.retryBtn} onClick={this.handleRetry} type="button">Réessayer</button>
            <Link to="/" className={styles.homeLink}>Retour à l'accueil</Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
