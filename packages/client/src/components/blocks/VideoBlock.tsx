import type { VideoContent } from '@extia-gaming/shared'
import styles from './blocks.module.css'
import { ExternalMedia } from '../ExternalMedia.tsx'

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null
    if (['youtube.com', 'www.youtube.com'].includes(u.hostname)) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
    }
  } catch {
    return null
  }
  return null
}

function twitchChannel(url: string): string | null {
  try {
    const u = new URL(url)
    if (['twitch.tv', 'www.twitch.tv'].includes(u.hostname)) {
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length >= 1) return parts[0] ?? null
    }
  } catch {
    return null
  }
  return null
}

export function VideoBlock({ content }: { content: VideoContent }) {
  if (content.provider === 'youtube') {
    const id = youtubeId(content.url)
    if (!id) return null
    return (
      <ExternalMedia provider="YouTube"><div className={styles.videoWrapper}>
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div></ExternalMedia>
    )
  }
  if (content.provider === 'twitch') {
    const channel = twitchChannel(content.url)
    if (!channel) return null
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    return (
      <ExternalMedia provider="Twitch"><div className={styles.videoWrapper}>
        <iframe
          src={`https://player.twitch.tv/?channel=${channel}&parent=${parent}`}
          title="Twitch stream"
          allowFullScreen
        />
      </div></ExternalMedia>
    )
  }
  return (
    <div className={styles.videoWrapper}>
      <video controls preload="none" src={content.url} />
    </div>
  )
}
