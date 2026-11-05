import { useState } from 'react'
import styles from './GameBanner.module.css'
export default function GameBanner({name,imageUrl}:{name:string;imageUrl:string|null}) {
  const [failed,setFailed]=useState<string|null>(null)
  return <div className={styles.banner}>{imageUrl && failed !== imageUrl ? <img src={imageUrl} alt={`Illustration du jeu ${name}`} onError={()=>setFailed(imageUrl)} /> : <span>{name}</span>}</div>
}
