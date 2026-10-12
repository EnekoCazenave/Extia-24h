import { useState } from 'react'
import { useQuery,useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '../services/api.ts'
import type { SiteSettings } from '@extia-gaming/shared'

export function usePlatform<T>(path:string,enabled=true,scope?:number) {
  return useQuery({queryKey:['platform',path,scope],queryFn:async()=>(await api.get<T>(path)).data,enabled,refetchInterval:30000})
}
export function usePlatformAction() {
  const qc=useQueryClient(),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function run(action:()=>Promise<unknown>) {
    setError('');setBusy(true)
    try {await action();await qc.invalidateQueries();return true}
    catch(e) {setError(isAxiosError(e)?e.response?.data?.error??'Opération impossible':e instanceof Error?e.message:'Opération impossible');return false}
    finally {setBusy(false)}
  }
  return {run,error,busy}
}
export interface PublicSettings extends SiteSettings {totalPoints:number}
export interface PlayerSummary {
  user:{id:number;login:string;group:{id:number;name:string}|null};rank:number;totalPoints:number;gamePoints:number;bonusPoints:number;eventPoints:number
  games:Array<{id:number;score:number;playedAt:string;gameType:{name:string;videoGame:{nom:string}}}>
  events:Array<{id:number;points:number;createdAt:string;event:{name:string}}>
  bonuses:Array<{id:number;points:number;createdAt:string;reason?:string|null}>
  sessions:Array<{id:number;status:string;score:number;createdAt:string;gameType:{name:string;videoGame:{nom:string}};userGames:Array<{score:number}>}>
}
export const points=(n:number)=>n.toLocaleString('fr-FR',{maximumFractionDigits:6})
export const dateTime=(date:string)=>new Date(date).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})
