import {afterEach,describe,it,expect,vi} from 'vitest'
import {readFavorites} from '../hooks/useFavoriteGames.ts'
afterEach(()=>{vi.restoreAllMocks();localStorage.clear()})
describe('Stockage des favoris',()=>{
 it('ignore les données corrompues, les identifiants invalides et les doublons',()=>{
   localStorage.setItem('favorites','oops');expect(readFavorites('favorites')).toEqual([])
   localStorage.setItem('favorites',JSON.stringify([1,1,-1,0,'2',2.5,2]));expect(readFavorites('favorites')).toEqual([1,2])
   localStorage.setItem('favorites','{}');expect(readFavorites('favorites')).toEqual([])
 })
 it('reste utilisable quand le navigateur interdit le stockage',()=>{
   vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new DOMException('denied')})
   expect(readFavorites('favorites')).toEqual([])
 })
})
