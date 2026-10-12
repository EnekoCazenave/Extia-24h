import { describe, it, expect } from 'vitest'
import { computeAwards, computeScore, PlayInputSchema, RulesConfigSchema, type ScoringMethod } from './src/index.js'

function calculate(method: ScoringMethod, values: Record<string, number>, config = {}, extra = {}, ids = [1]) {
  return computeAwards(RulesConfigSchema.parse({ type: 'RULES', method, ...config }), PlayInputSchema.parse({ calculType: 'RULES', gameTypeId: 1, values, ...extra }), ids)
}
const item = { key: 'gold', label: 'Or', points: 5, lossPoints: 2 }

describe('Barèmes du PDF', () => {
  it.each([[1,60],[99,0.006],[50,15],[25,33.75],[100,0]])('BR : top %i / 100 = %f', (rank, expected) => {
    expect(calculate('BATTLE_ROYALE', { rank, total: 100 })[0].score).toBe(expected)
  })
  it('applique coefficients de groupe et de mode', () => {
    const awards = calculate('MATCH', { won: 1 }, { winPoints: 10, participantCoefficients: [{ participants: 2, coefficient: 1.5 }], modes: [{ key: 'duo', label: 'Duo', coefficient: 2 }] }, { mode: 'duo' }, [1,2])
    expect(awards.map(a => a.score)).toEqual([30,30])
  })
  it('runs : défaite et difficulté linéaire', () => {
    expect(calculate('RUN', { won: 0, difficulty: 3 }, { lossPoints: 4, difficultyStep: 0.5 })[0].score).toBe(10)
  })
  it('Hadès : première réussite remplace les ressources', () => {
    const cfg = { winPoints: 10, difficultyStep: 0.5, firstWinBonus: 30, items: [item] }
    expect(calculate('HADES', { won: 1, difficulty: 2, firstWin: 1, item_gold: 8 }, cfg)[0].score).toBe(50)
    expect(calculate('HADES', { won: 1, difficulty: 2, firstWin: 0, item_gold: 8 }, cfg)[0].score).toBe(60)
  })
  it('Hunt : ressources distinctes et durée en cas de défaite', () => {
    const cfg = { winPoints: 10, lossPoints: 1, items: [item], timeTiers: [{ seconds: 60, points: 3 }, { seconds: 180, points: 2 }] }
    expect(calculate('HUNT', { won: 0, seconds: 60, item_gold: 3 }, cfg)[0].score).toBe(10)
    expect(calculate('HUNT', { won: 1, seconds: 60, item_gold: 3 }, cfg)[0].score).toBe(25)
  })
  it('PoE2 / Peak / Pokémon : objectifs, coefficients et bonus final', () => {
    expect(calculate('COUNTER', { item_gold: 8, completed: 1 }, { items: [item], completionBonus: 20 })[0].score).toBe(60)
  })
  it('Clair Obscur : différence de paliers, reprise et pactole', () => {
    const cfg = { items: Array.from({length: 22}, (_,i) => ({ key: `boss${i}`, label: `Boss ${i}`, points: 10 })), completionBonus: 100, resumedMultiplier: 0.5 }
    expect(calculate('PROGRESSION', { start: 5, end: 8, resumed: 1 }, cfg)[0].score).toBe(15)
    expect(calculate('PROGRESSION', { start: 0, end: 22, resumed: 0 }, cfg)[0].score).toBe(320)
    expect(calculate('PROGRESSION', { start: 20, end: 22, resumed: 0 }, cfg)[0].score).toBe(20)
  })
  it('TFT Double Up utilise son barème', () => {
    expect(calculate('TFT', { rank: 2 }, { modes: [{ key: 'double-up', label: 'Double Up', coefficient: 2, ranks: [20,10,5,0] }] }, { mode: 'double-up' })[0].score).toBe(20)
  })
  it('Tetris récompense davantage les plus gros scores individuels', () => {
    const awards = calculate('SCORE', {}, { scoreMultiplier: 0.01 }, { results: [{ userId: 1, values: { score: 1000 } }, { userId: 2, values: { score: 4000 } }] }, [1,2])
    expect(awards.map(a => a.score)).toEqual([10,40])
  })
  it('Simracing : somme des mesures configurées', () => {
    expect(calculate('SIMRACING', { item_time: 60, item_laps: 2 }, { items: [{ key: 'time', label: 'Temps (s)', points: 0.1 }, { key: 'laps', label: 'Tours', points: 5 }] })[0].score).toBe(16)
  })
  it.each(['EQUAL','PROPORTIONAL'])('Minecraft : seuil et pot %s', split => {
    const awards = calculate('MINECRAFT', { communityCompleted: 1 }, { items: [{ key:'a',label:'A',points:10 },{ key:'b',label:'B',points:20 }], communityPool: 60, eligibilityScore: 10, communitySplit: split }, { results: [{ userId:1,values:{item_a:1,item_b:0} }, { userId:2,values:{item_a:0,item_b:1} }, { userId:3,values:{item_a:0,item_b:0} }] }, [1,2,3])
    expect(awards.map(a => a.score)).toEqual(split === 'EQUAL' ? [40,50,0] : [30,60,0])
  })
  it('mini-jeu : partage 95 % et bonus 5 %, conservation du pot', () => {
    const awards = calculate('MINIGAME', { winnerId: 2 }, { attendancePoints: 10 }, {}, [1,2,3])
    expect(awards[1].score).toBeCloseTo(11, 5)
    expect(awards.reduce((s,a) => s+a.score,0)).toBeCloseTo(30, 6)
  })
  it.each([{rank:0,total:100},{rank:101,total:100},{rank:1,total:1},{rank:2.5,total:100}])('refuse un classement impossible : %j', values => {
    expect(() => calculate('BATTLE_ROYALE', values)).toThrow()
  })
  it('refuse les résultats manquants, doublons et usurpation de participants', () => {
    expect(() => calculate('SCORE', { score: 10 }, {}, {}, [1,2])).toThrow()
    expect(() => calculate('SCORE', {}, {}, {results:[{userId:1,values:{score:10}},{userId:1,values:{score:10}}]}, [1,2])).toThrow()
    expect(() => calculate('MINIGAME', {winnerId:3}, {}, {}, [1,2])).toThrow()
    expect(() => calculate('MATCH', {won:1}, {}, {}, [1,1])).toThrow()
  })
  it('refuse les booléens, modes, coefficients et paliers invalides', () => {
    expect(() => calculate('MATCH', {won:2})).toThrow()
    expect(() => calculate('MATCH', {won:1}, {participantCoefficients:[{participants:2,coefficient:1}]})).toThrow()
    expect(() => calculate('TFT', {rank:1})).toThrow()
    expect(() => calculate('PROGRESSION', {start:1,end:0,resumed:0}, {items:[item]})).toThrow()
  })
  it('conserve les trois calculs historiques', () => {
    expect(computeScore({type:'BOOLEAN',trueValue:10,falseValue:0},PlayInputSchema.parse({gameTypeId:1,calculType:'BOOLEAN',value:true}))).toBe(10)
    expect(computeScore({type:'NUMBER',multiplier:2},PlayInputSchema.parse({gameTypeId:1,calculType:'NUMBER',value:2.3}))).toBe(5)
    expect(computeScore({type:'TIME',tiers:[{timeSeconds:60,points:10}]},PlayInputSchema.parse({gameTypeId:1,calculType:'TIME',timeSeconds:60}))).toBe(10)
  })
})
