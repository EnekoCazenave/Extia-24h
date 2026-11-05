import {beforeEach,describe,expect,it,vi} from 'vitest'
import ExcelJS from 'exceljs'
import {organizerParticipants,organizerSheet,workbookFromSheets,reportingData,exportWorkbook} from '../src/services/reporting.service.js'
const db=vi.hoisted(()=>({user:{findMany:vi.fn()},organizationGroup:{findMany:vi.fn()},gameSession:{findMany:vi.fn()},userGame:{findMany:vi.fn()},pointBonus:{findMany:vi.fn()},eventAward:{findMany:vi.fn()},groupPoint:{findMany:vi.fn()},event:{findMany:vi.fn()},userEvent:{findMany:vi.fn()},videoGame:{findMany:vi.fn()},gameType:{findMany:vi.fn()},siteSettings:{findUnique:vi.fn()},$transaction:vi.fn()}))
vi.mock('../src/lib/prisma.js',()=>({prisma:db}))
const person=(id:number,statisticsConsent:boolean,statisticsConsentVersion:string|null='2026-10-16',statisticsConsentUpdatedAt:Date|null=new Date())=>({id,login:`Pseudo-${id}`,firstname:`PrenomSecret-${id}`,lastname:`NomSecret-${id}`,statisticsConsent,statisticsConsentVersion,statisticsConsentUpdatedAt,group:{id:7,name:'Campus',kind:'STUDENT'}})
beforeEach(()=>{vi.resetAllMocks();db.$transaction.mockImplementation(async work=>work(db))})
describe('organizer list privacy',()=>{
  it('includes every account but blanks both name fields without current consent',async()=>{
    db.user.findMany.mockResolvedValue([person(1,true),person(2,false),person(3,true,'old'),person(4,true,null),person(5,true,'2026-10-16',null)])
    const rows=await organizerParticipants();expect(rows).toHaveLength(5);expect(rows[0]).toMatchObject({firstname:'PrenomSecret-1',lastname:'NomSecret-1',category:'Etudiant'})
    for(const row of rows.slice(1)){expect(row.firstname).toBe('');expect(row.lastname).toBe('')}
    const output=JSON.stringify(rows);expect(output).not.toContain('NomSecret-2');expect(output).not.toContain('NomSecret-3');expect(output).not.toContain('NomSecret-4');expect(output).not.toContain('NomSecret-5');expect(output).not.toContain('statisticsConsent')
    expect(db.user.findMany.mock.calls[0][0].where).toEqual({});expect(db.user.findMany.mock.calls[0][0].select).not.toHaveProperty('email');expect(db.user.findMany.mock.calls[0][0].select).not.toHaveProperty('password')
  })
  it('takes withdrawal into account on the next request',async()=>{
    db.user.findMany.mockResolvedValueOnce([person(1,true)]).mockResolvedValueOnce([person(1,false)])
    expect((await organizerParticipants())[0].firstname).toBe('PrenomSecret-1');expect((await organizerParticipants())[0].firstname).toBe('')
  })
  it('applies the same pseudo, group and category selection to the server list/export',async()=>{
    db.user.findMany.mockResolvedValue([]);await organizerSheet({search:'Pseudo',groupId:7,kind:'STUDENT'})
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{login:{contains:'Pseudo',mode:'insensitive'},groupId:7,group:{kind:'STUDENT'}}}))
    await organizerParticipants({groupId:'none'});expect(db.user.findMany).toHaveBeenLastCalledWith(expect.objectContaining({where:{groupId:null}}))
  })
  it('writes a filterable workbook with empty cells, accents and literal spreadsheet strings',async()=>{
    db.user.findMany.mockResolvedValue([{...person(1,true),login:'=HYPERLINK("https://example.invalid")',firstname:'Élodie'},person(2,false)])
    const sheet=await organizerSheet(),wb=new ExcelJS.Workbook();await wb.xlsx.load(await workbookFromSheets([sheet]))
    const ws=wb.getWorksheet('Liste organisateurs')!;expect(ws.getRow(1).values).toEqual([undefined,'Pseudo','Prénom','Nom','Groupe','Catégorie'])
    expect(ws.getCell('A2').value).toBe('=HYPERLINK("https://example.invalid")');expect(ws.getCell('B2').value).toBe('Élodie');expect(ws.getCell('B3').value??'').toBe('');expect(ws.getCell('C3').value??'').toBe('');expect(ws.autoFilter).toBe('A1:E3')
    expect(ws.views[0]).toMatchObject({state:'frozen',ySplit:1});expect(JSON.stringify(ws.model)).not.toContain('NomSecret-2')
  })
  it('keeps the separate statistical workbook pseudonymous',async()=>{
    db.user.findMany.mockResolvedValue([{id:1,login:'Pseudo',groupId:null}]);db.siteSettings.findUnique.mockResolvedValue(null)
    for(const model of [db.organizationGroup,db.gameSession,db.userGame,db.pointBonus,db.eventAward,db.groupPoint,db.event,db.userEvent,db.videoGame,db.gameType])model.findMany.mockResolvedValue([])
    const report=await reportingData();expect(report.participants).toHaveLength(1)
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{statisticsConsent:true},select:{id:true,login:true,groupId:true}}))
    const wb=new ExcelJS.Workbook();await wb.xlsx.load(await exportWorkbook());expect(wb.getWorksheet('Participants')).toBeDefined();expect(wb.getWorksheet('Liste organisateurs')).toBeUndefined()
    const json=JSON.stringify(report.sheets);expect(json).not.toContain('Prénom');expect(json).not.toContain('Email');expect(json).not.toContain('NomSecret')
  })
})
