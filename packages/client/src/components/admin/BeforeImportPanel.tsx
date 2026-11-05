import {useState, type FormEvent} from 'react'
import {usePlatform, usePlatformAction, points} from '../../hooks/usePlatform.ts'
import {api} from '../../services/api.ts'
import s from '../Platform.module.css'

interface BeforeParticipant {
  id:number;sourceKey:string;sourceName:string;sourceRow:number;rawName:string;firstname:string;lastname:string
  points:number|null;userId:number|null;user:{id:number;login:string}|null
}
interface ImportReport {created:number;updated:number;unchanged:number;linked:number;unlinked:number;ambiguous:number;missingPoints:number;totalPoints:number}

export default function BeforeImportPanel() {
  const query=usePlatform<{participants:BeforeParticipant[]}>('/api/admin/before')
  const action=usePlatformAction()
  const [file,setFile]=useState<File|null>(null)
  const [report,setReport]=useState<ImportReport|null>(null)
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if(!file)return
    const form=e.currentTarget, data=new FormData(form)
    data.set('file',file)
    data.set('replaceExisting',data.get('replaceExisting')==='on'?'true':'false')
    setReport(null)
    await action.run(async()=>{const result=await api.post<{report:ImportReport}>('/api/admin/before/import',data,{headers:{'Content-Type':'multipart/form-data'}});setReport(result.data.report)})
  }
  const rows=query.data?.participants??[]
  return <section className={s.section}>
    <h2>Importer les points Before</h2>
    <p>Le classeur Excel doit contenir un onglet « participant » : nom complet en colonne A, points en colonne B. Les lignes sont conservées et associées aux comptes existants ou lors de leur inscription.</p>
    <form className={s.form} onSubmit={submit}>
      <label className={s.field}>Identifiant du Before<input name="sourceKey" required maxLength={100} defaultValue="before-mariokart"/></label>
      <p>Conservez le même identifiant lors d’un nouvel import de ce Before pour éviter de compter les points deux fois. Utilisez un autre identifiant pour un autre Before.</p>
      <label className={s.field}>Classeur Excel<input name="file" type="file" onChange={e=>setFile(e.target.files?.[0]??null)} accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required/></label>
      <label className={s.field}><span><input name="replaceExisting" type="checkbox"/> Corriger les points déjà importés pour ce Before</span></label>
      <p>Cette option remplace les points des lignes déjà présentes par les valeurs du fichier. Sans cette option, un changement de points est refusé.</p>
      {action.error&&<p role="alert">{action.error}</p>}
      <button className={s.button} disabled={action.busy}>{action.busy?'Import en cours…':'Importer le classeur'}</button>
    </form>
    {report&&<section role="status" aria-label="Bilan de l’import"><h3>Import terminé</h3><p>{report.created} ligne(s) créée(s), {report.updated} corrigée(s), {report.unchanged} inchangée(s).</p><p>{report.linked} associée(s), {report.unlinked} en attente de compte, {report.ambiguous} correspondance(s) ambiguë(s), {report.missingPoints} sans score.</p><p>{points(report.totalPoints)} points dans le fichier.</p></section>}
    <h3>Lignes importées</h3>
    {query.isLoading&&<p role="status">Chargement des imports…</p>}
    {query.isError&&<p role="alert">Impossible de charger les imports. <button className={s.button} onClick={()=>void query.refetch()}>Réessayer</button></p>}
    {!query.isLoading&&!query.isError&&rows.length===0&&<p>Aucun Before importé.</p>}
    {rows.length>0&&<div style={{overflowX:'auto'}}><table className={s.reportTable}><caption>{rows.length} ligne(s) conservée(s)</caption><thead><tr><th>Before</th><th>Nom importé</th><th>Points</th><th>Association au compte</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.sourceKey}</td><td>{row.rawName}</td><td>{row.points===null?'Score absent':points(row.points)}</td><td>{row.user?`Associé à ${row.user.login}`:'En attente de compte ou correspondance ambiguë'}</td></tr>)}</tbody></table></div>}
  </section>
}
