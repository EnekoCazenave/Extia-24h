import {beforeEach,describe,expect,it,vi} from 'vitest'
import ExcelJS from 'exceljs'
import Fastify from 'fastify'
const db = vi.hoisted(() => ({$transaction:vi.fn(),$queryRaw:vi.fn(),user:{findMany:vi.fn(),findUnique:vi.fn(),create:vi.fn()},organizationGroup:{findFirst:vi.fn()},beforeParticipant:{findMany:vi.fn(),findUnique:vi.fn(),create:vi.fn(),update:vi.fn()},pointBonus:{create:vi.fn(),update:vi.fn()}}))
vi.mock('../src/lib/prisma.js',()=>({prisma:db}))
vi.mock('bcryptjs',()=>({default:{hash:vi.fn().mockResolvedValue('hash')}}))
vi.mock('../src/hooks/requireAdmin.js',()=>({requireAdmin:async (r:any,reply:any)=>{if(r.headers['x-test-role']!=='admin')return reply.code(403).send({error:'Forbidden'});r.user={sub:9,roleId:2}}}))
import {parseBeforeWorkbook,importBeforeParticipants,normalizeBeforeName} from '../src/services/before.service.js'
import {registerUser} from '../src/services/auth.service.js'
import {beforeRoutes} from '../src/routes/before.js'

let users:any[], rows:any[], bonuses:any[]
beforeEach(()=>{
  vi.clearAllMocks(); users=[];rows=[];bonuses=[]
  db.$transaction.mockImplementation(async work=>{
    const snapshot=structuredClone({users,rows,bonuses})
    try{return await work(db)}catch(error){users=snapshot.users;rows=snapshot.rows;bonuses=snapshot.bonuses;throw error}
  })
  db.$queryRaw.mockResolvedValue([])
  db.user.findMany.mockImplementation(async()=>users)
  db.user.findUnique.mockImplementation(async({where})=>users.find(u=>u.email===where.email)??null)
  db.user.create.mockImplementation(async({data})=>{const user={...data,id:users.length+1,role:{id:1,name:'player'}};users.push(user);return user})
  db.beforeParticipant.findUnique.mockImplementation(async({where})=>{const key=where.sourceKey_firstnameKey_lastnameKey;return rows.find(r=>r.sourceKey===key.sourceKey&&r.firstnameKey===key.firstnameKey&&r.lastnameKey===key.lastnameKey)??null})
  db.beforeParticipant.findMany.mockImplementation(async({where}={})=>!where?rows:rows.filter(r=>r.userId===where.userId&&r.firstnameKey===where.firstnameKey&&r.lastnameKey===where.lastnameKey))
  db.beforeParticipant.create.mockImplementation(async({data})=>{const row={id:rows.length+1,userId:null,bonusId:null,...data};rows.push(row);return row})
  db.beforeParticipant.update.mockImplementation(async({where,data})=>{const row=rows.find(r=>r.id===where.id);Object.assign(row,data);return row})
  db.pointBonus.create.mockImplementation(async({data})=>{const bonus={id:bonuses.length+1,...data};bonuses.push(bonus);return bonus})
  db.pointBonus.update.mockImplementation(async({where,data})=>{const bonus=bonuses.find(b=>b.id===where.id);Object.assign(bonus,data);return bonus})
})
async function file(values:unknown[][],name='participant') {
  const workbook=new ExcelJS.Workbook();workbook.addWorksheet(name).addRows(values)
  return Buffer.from(await workbook.xlsx.writeBuffer())
}
async function inputs(points:number|null=12.5) {return parseBeforeWorkbook(await file([['DE BERDT Élodie',points]]))}

describe('Before workbook parsing',()=>{
  it('uses only participant, preserves row/raw identity and fractional cached formula results',async()=>{
    const workbook=new ExcelJS.Workbook();workbook.addWorksheet('Other').addRow(['ignore',999])
    const sheet=workbook.addWorksheet('participant');sheet.addRows([['DE BERDT Élodie',{formula:'25/2',result:12.5}],[],['DUPONT Jean-Pierre','2,75'],['MARTIN Léa',null]])
    const result=await parseBeforeWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()))
    expect(result).toHaveLength(3);expect(result[0]).toMatchObject({sourceRow:1,rawName:'DE BERDT Élodie',lastname:'DE BERDT',firstname:'Élodie',points:12.5,firstnameKey:'elodie',lastnameKey:'de berdt'})
    expect(result[1]).toMatchObject({sourceRow:3,points:2.75});expect(result[2].points).toBeNull()
    expect(normalizeBeforeName('  D’ÀRC   ')).toBe("d'arc")
  })
  it('rejects duplicate normalized identities, bad points, missing sheet, and formulas without cache',async()=>{
    await expect(parseBeforeWorkbook(await file([['DUPONT Élodie',1],['DUPONT Elodie',2]]))).rejects.toThrow('plusieurs fois')
    await expect(parseBeforeWorkbook(await file([['DUPONT Élodie',-1]]))).rejects.toThrow('points invalides')
    await expect(parseBeforeWorkbook(await file([['DUPONT Élodie',{formula:'1+2'}]]))).rejects.toThrow('formule sans résultat')
    await expect(parseBeforeWorkbook(await file([['DUPONT Élodie',1]],'Wrong'))).rejects.toThrow('participant')
  })
})

describe('Before linking and single credit',()=>{
  it('credits an existing normalized identity without rounding, and never doubles a reimport',async()=>{
    users.push({id:4,firstname:'élodie',lastname:'de berdt'})
    const input=await inputs()
    expect(await importBeforeParticipants(input,'before','first.xlsx',9)).toMatchObject({created:1,linked:1,totalPoints:12.5})
    expect(rows[0]).toMatchObject({userId:4,bonusId:1,sourceName:'first.xlsx',sourceRow:1})
    expect(bonuses).toEqual([{id:1,userId:4,grantedById:9,points:12.5,reason:'Before — before'}])
    expect(await importBeforeParticipants(input,'before','copy.xlsx',9)).toMatchObject({unchanged:1,linked:1})
    expect(bonuses).toHaveLength(1);expect(db.$queryRaw).toHaveBeenCalledTimes(2)
  })
  it('associates an unclaimed import and credits it inside the account registration transaction',async()=>{
    await importBeforeParticipants(await inputs(),'before','source.xlsx',9)
    expect(rows[0].userId).toBeNull();expect(bonuses).toHaveLength(0)
    const user=await registerUser({login:'player',email:'player@example.test',password:'Password123!',firstname:'Elodie',lastname:'DE BERDT',intern:false,statisticsConsent:false})
    expect(user).not.toHaveProperty('password');expect(rows[0].userId).toBe(user.id);expect(bonuses[0]).toMatchObject({userId:user.id,points:12.5})
    expect(db.$transaction).toHaveBeenCalledTimes(2)
    expect(db.$transaction).toHaveBeenLastCalledWith(expect.any(Function),expect.objectContaining({isolationLevel:'Serializable'}))
  })
  it('keeps ambiguous identities unclaimed and never transfers an already linked row',async()=>{
    users.push({id:1,firstname:'Elodie',lastname:'DE BERDT'},{id:2,firstname:'Élodie',lastname:'DE BERDT'})
    expect(await importBeforeParticipants(await inputs(),'before','source.xlsx',9)).toMatchObject({unlinked:1,ambiguous:1})
    expect(bonuses).toHaveLength(0)
    users.pop();await importBeforeParticipants(await inputs(),'before','source.xlsx',9)
    users.push({id:2,firstname:'Élodie',lastname:'DE BERDT'})
    await importBeforeParticipants(await inputs(),'before','source.xlsx',9)
    expect(rows[0].userId).toBe(1);expect(bonuses).toHaveLength(1)
  })
  it('requires explicit replacement for score changes and updates the same credit',async()=>{
    users.push({id:4,firstname:'élodie',lastname:'de berdt'})
    await importBeforeParticipants(await inputs(),'before','source.xlsx',9)
    await expect(importBeforeParticipants(await inputs(14.25),'before','source.xlsx',9)).rejects.toThrow('Confirmez explicitement')
    expect(bonuses[0].points).toBe(12.5)
    expect(await importBeforeParticipants(await inputs(14.25),'before','source.xlsx',9,true)).toMatchObject({updated:1,totalPoints:14.25})
    expect(bonuses).toHaveLength(1);expect(bonuses[0].points).toBe(14.25)
    await expect(importBeforeParticipants(await inputs(null),'before','source.xlsx',9,true)).rejects.toThrow('cellule vide')
  })
  it('retains incomplete source rows and credits later when their missing points are supplied',async()=>{
    users.push({id:4,firstname:'élodie',lastname:'de berdt'})
    expect(await importBeforeParticipants(await inputs(null),'before','source.xlsx',9)).toMatchObject({linked:1,missingPoints:1})
    expect(rows[0]).toMatchObject({userId:4,points:null,bonusId:null});expect(bonuses).toHaveLength(0)
    await importBeforeParticipants(await inputs(2.5),'before','source.xlsx',9,true)
    // Existing user linkage must still be credited when the first usable score arrives.
    expect(bonuses).toHaveLength(1);expect(bonuses[0].points).toBe(2.5)
  })
})

describe('Before admin routes',()=>{
  it('protects both read and import from non-admins',async()=>{
    const app=Fastify();await app.register(beforeRoutes)
    try {
      expect((await app.inject({method:'GET',url:'/api/admin/before'})).statusCode).toBe(403)
      expect((await app.inject({method:'POST',url:'/api/admin/before/import'})).statusCode).toBe(403)
      expect(db.beforeParticipant.findMany).not.toHaveBeenCalled()
    } finally {await app.close()}
  })
  it('imports multipart using the supplied source key and returns a no-store report',async()=>{
    const app=Fastify();await app.register(beforeRoutes)
    const buffer=await file([['DUPONT Jean',3.5]]),boundary='before-test-boundary'
    const payload=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="sourceKey"\r\n\r\ncustom-before\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="before.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),buffer,Buffer.from(`\r\n--${boundary}--\r\n`)])
    try {
      const response=await app.inject({method:'POST',url:'/api/admin/before/import',headers:{'x-test-role':'admin','content-type':`multipart/form-data; boundary=${boundary}`},payload})
      expect(response.statusCode).toBe(200);expect(response.json().report).toMatchObject({created:1,unlinked:1,totalPoints:3.5});expect(response.headers['cache-control']).toBe('no-store')
      expect(rows[0].sourceKey).toBe('custom-before')
    }finally {await app.close()}
  })
})
