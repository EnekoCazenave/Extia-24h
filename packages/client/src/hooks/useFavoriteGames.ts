import { useEffect, useState } from 'react'

export function readFavorites(key: string): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? [...new Set(value.filter((id): id is number => Number.isSafeInteger(id) && id > 0))] : []
  } catch { return [] }
}

export function useFavoriteGames(userId?: number) {
  const key = `extia:favorite-games:${userId ?? 'guest'}`
  const [state, setState] = useState(() => ({key, ids: readFavorites(key)}))
  const ids = state.key === key ? state.ids : readFavorites(key)
  useEffect(() => {
    setState({key, ids: readFavorites(key)})
    const sync = (event: StorageEvent) => { if (event.key === key || event.key === null) setState({key, ids: readFavorites(key)}) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [key])
  function toggle(id: number) {
    const next = ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]
    setState({key, ids: next})
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* Keep the current session usable when storage is unavailable. */ }
  }
  return {favoriteIds: ids, toggle}
}
