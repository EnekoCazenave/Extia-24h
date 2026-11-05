import ExcelJS from 'exceljs'
import type { BeforeParticipant, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { eventTransaction, EventError } from './event-scoring.service.js'

export interface BeforeRow {
  sourceRow: number
  rawName: string
  firstname: string
  lastname: string
  firstnameKey: string
  lastnameKey: string
  points: number | null
}

export function normalizeBeforeName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’‘]/g, "'").trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr')
}

function cellValue(cell: ExcelJS.Cell): ExcelJS.CellValue | undefined {
  const value = cell.value
  if (value && typeof value === 'object' && ('formula' in value || 'sharedFormula' in value)) return value.result
  return value
}

export async function parseBeforeWorkbook(buffer: Buffer): Promise<BeforeRow[]> {
  const workbook = new ExcelJS.Workbook()
  try { await workbook.xlsx.load(Uint8Array.from(buffer).buffer) }
  catch { throw new EventError('Le fichier doit être un classeur Excel .xlsx valide.', 400) }
  const sheet = workbook.worksheets.find(s => normalizeBeforeName(s.name) === 'participant')
  if (!sheet) throw new EventError('Le classeur ne contient pas l’onglet « participant ».', 400)
  if (sheet.rowCount > 10000) throw new EventError('L’import est limité à 10 000 lignes.', 400)
  const rows: BeforeRow[] = [], identities = new Set<string>()
  sheet.eachRow((row, sourceRow) => {
    const rawName = cellValue(row.getCell(1)), rawPoints = cellValue(row.getCell(2))
    if ((rawName == null || rawName === '') && (rawPoints == null || rawPoints === '')) return
    // The supplied template has no header: uppercase surname (possibly compound), then first name.
    if (typeof rawName !== 'string' || rawName.length > 300) throw new EventError(`Ligne ${sourceRow} : nom invalide.`, 400)
    const name = rawName.trim().replace(/\s+/g, ' ')
    const match = name.match(/^([\p{Lu}\p{M}\d’'.-]+(?:\s+[\p{Lu}\p{M}\d’'.-]+)*)\s+(.+)$/u)
    if (!match) throw new EventError(`Ligne ${sourceRow} : utilisez « NOM Prénom » dans la colonne A.`, 400)
    const lastname = match[1], firstname = match[2]
    const firstnameKey = normalizeBeforeName(firstname), lastnameKey = normalizeBeforeName(lastname)
    const identity = JSON.stringify([firstnameKey, lastnameKey])
    if (identities.has(identity)) throw new EventError(`Ligne ${sourceRow} : ce nom et prénom apparaissent plusieurs fois dans le fichier. Regroupez leurs points avant l’import.`, 400)
    identities.add(identity)
    // Cached numeric formula results are imported; formulas and external links are never evaluated.
    const points = rawPoints == null || (typeof rawPoints === 'string' && rawPoints.trim() === '') ? null : typeof rawPoints === 'number' ? rawPoints : typeof rawPoints === 'string' ? Number(rawPoints.trim().replace(',', '.')) : NaN
    if (points !== null && (!Number.isFinite(points) || points < 0 || points > 1e9)) throw new EventError(`Ligne ${sourceRow} : points invalides ou formule sans résultat numérique.`, 400)
    if (rawPoints === undefined && row.getCell(2).value !== null) throw new EventError(`Ligne ${sourceRow} : formule sans résultat enregistré. Recalculez puis enregistrez le classeur.`, 400)
    rows.push({ sourceRow, rawName, firstname, lastname, firstnameKey, lastnameKey, points })
  })
  if (!rows.length) throw new EventError('L’onglet « participant » est vide.', 400)
  return rows
}

// Registration and import share the same transaction lock, so neither can miss the other.
export async function lockBeforeParticipants(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(24824001)::text`
}

type NamedUser = { id: number; firstname: string; lastname: string }
function matchingUsers(users: NamedUser[], row: Pick<BeforeRow, 'firstnameKey' | 'lastnameKey'>) {
  return users.filter(user => normalizeBeforeName(user.firstname) === row.firstnameKey && normalizeBeforeName(user.lastname) === row.lastnameKey)
}

async function associateRow(tx: Prisma.TransactionClient, row: BeforeParticipant, userId: number) {
  // A linked row stays linked, including when another account later uses the same name.
  if (row.userId !== null && row.userId !== userId) return
  let bonusId = row.bonusId
  if (row.points !== null && bonusId === null) {
    const bonus = await tx.pointBonus.create({data:{userId, grantedById:row.importedById, points:row.points, reason:`Before — ${row.sourceKey}`}})
    bonusId = bonus.id
  }
  await tx.beforeParticipant.update({where:{id:row.id},data:{userId,bonusId}})
}

export async function claimBeforeParticipants(tx: Prisma.TransactionClient, user: NamedUser): Promise<void> {
  const identity = {firstnameKey:normalizeBeforeName(user.firstname),lastnameKey:normalizeBeforeName(user.lastname)}
  const rows = await tx.beforeParticipant.findMany({where:{...identity,userId:null}})
  if (!rows.length) return
  const users = await tx.user.findMany({select:{id:true,firstname:true,lastname:true}})
  if (matchingUsers(users, identity).length !== 1) return
  for (const row of rows) await associateRow(tx, row, user.id)
}

export async function importBeforeParticipants(rows: BeforeRow[], sourceKey: string, sourceName: string, importedById: number, replaceExisting = false) {
  return eventTransaction(async tx => {
    await lockBeforeParticipants(tx)
    const users = await tx.user.findMany({select:{id:true,firstname:true,lastname:true}})
    const report = {created:0,updated:0,unchanged:0,linked:0,unlinked:0,ambiguous:0,missingPoints:0,totalPoints:0}
    for (const input of rows) {
      const existing = await tx.beforeParticipant.findUnique({where:{sourceKey_firstnameKey_lastnameKey:{sourceKey,firstnameKey:input.firstnameKey,lastnameKey:input.lastnameKey}}})
      let row: BeforeParticipant
      if (existing) {
        if (existing.points !== input.points) {
          if (!replaceExisting) throw new EventError(`Ligne ${input.sourceRow} : les points diffèrent d’un import précédent. Confirmez explicitement le remplacement pour mettre à jour ce Before.`, 409)
          if (existing.points !== null && input.points === null) throw new EventError(`Ligne ${input.sourceRow} : un score déjà importé ne peut pas être remplacé par une cellule vide.`, 409)
          if (existing.bonusId !== null) await tx.pointBonus.update({where:{id:existing.bonusId},data:{points:input.points!}})
          report.updated++
        } else report.unchanged++
        row = await tx.beforeParticipant.update({where:{id:existing.id},data:{...input,sourceName}})
      } else {
        row = await tx.beforeParticipant.create({data:{...input,sourceKey,sourceName,importedById}})
        report.created++
      }
      const matches = matchingUsers(users, input)
      if (row.userId !== null) { await associateRow(tx,row,row.userId); report.linked++ }
      else if (matches.length === 1) { await associateRow(tx,row,matches[0].id); report.linked++ }
      else { report.unlinked++; if (matches.length > 1) report.ambiguous++ }
      if (input.points === null) report.missingPoints++
      report.totalPoints += input.points ?? 0
    }
    return report
  })
}

export async function listBeforeParticipants() {
  return prisma.beforeParticipant.findMany({orderBy:[{sourceKey:'asc'},{sourceRow:'asc'}],include:{user:{select:{id:true,login:true}}}})
}
