import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section aria-labelledby="notfound-title">
      <h1 id="notfound-title">Page introuvable</h1>
      <p>Cette page n'existe pas.</p>
      <Link to="/">Retour à l'accueil</Link>
    </section>
  )
}
