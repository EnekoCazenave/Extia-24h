import {describe,expect,it,vi} from 'vitest'
vi.mock('../src/lib/prisma.js',()=>({prisma:{}}))
import {csvCell,toCsv} from '../src/services/community.service.js'

describe('French CSV exports',()=>{
  it('preserves commas, semicolons, quotes, line breaks and accents in a single quoted cell',()=>{
    expect(csvCell('Élodie, "oui";\nligne')).toBe('"Élodie, ""oui"";\nligne"')
    const csv=toCsv([{Nom:'Élodie, "oui";\nligne',Points:12.5,Vide:null}],['Nom','Points','Vide'])
    expect(csv).toBe('\uFEFF"Nom";"Points";"Vide"\r\n"Élodie, ""oui"";\nligne";"12,5";""')
  })
  it('formats numbers with decimal commas without neutralizing negative numbers as text',()=>{
    expect(csvCell(-12.5)).toBe('"-12,5"');expect(csvCell(0)).toBe('"0"');expect(csvCell(1.25)).toBe('"1,25"')
    expect(csvCell('-12,5')).toBe('"\'-12,5"')
  })
  it('neutralizes formulas in text and retains ISO dates',()=>{
    for(const value of ['=SUM(A1)',' +SUM(A1)','@X','-CMD'])expect(csvCell(value)).toBe(`"'${value}"`)
    expect(csvCell(new Date('2026-11-05T12:00:00Z'))).toBe('"2026-11-05T12:00:00.000Z"')
  })
})
