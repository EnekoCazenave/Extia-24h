import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title: string
  description: string
  canonicalPath?: string
  ogImage?: string
  jsonLd?: object
}

const SITE_NAME = 'Extia Gaming 24h'
const BASE_URL = 'https://gaming24h.extia.fr'

export default function SEOHead({
  title,
  description,
  canonicalPath = '/',
  ogImage = '/og-default.png',
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`
  const canonicalUrl = `${BASE_URL}${canonicalPath}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="theme-color" content="#1a1a2e" />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${BASE_URL}${ogImage}`} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
