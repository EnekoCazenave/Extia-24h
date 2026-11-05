import {beforeEach,expect,it,vi} from 'vitest'
import {screen,waitFor,fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '../test-utils.tsx'
import BeforeImportPanel from '../components/admin/BeforeImportPanel.tsx'
import {api} from '../services/api.ts'
vi.mock('../hooks/usePlatform.ts',async original=>({...await original<typeof import('../hooks/usePlatform.ts')>(),usePlatform:()=>({data:{participants:[]},isLoading:false,isError:false})}))
vi.mock('../services/api.ts',()=>({api:{post:vi.fn()}}))
beforeEach(()=>{vi.clearAllMocks();vi.mocked(api.post).mockResolvedValue({data:{report:{created:2,updated:0,unchanged:0,linked:1,unlinked:1,ambiguous:0,missingPoints:0,totalPoints:300}}})})
it('sends the workbook and stable source key, with replacement explicitly disabled',async()=>{
  renderWithProviders(<BeforeImportPanel/>)
  const file=new File(['workbook'],'before.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
  await userEvent.upload(screen.getByLabelText('Classeur Excel'),file)
  expect((screen.getByLabelText('Classeur Excel') as HTMLInputElement).files?.[0]).toBe(file)
  // jsdom does not apply the native required-file validity after userEvent.upload.
  fireEvent.submit(screen.getByRole('button',{name:'Importer le classeur'}).closest('form')!)
  await waitFor(()=>expect(api.post).toHaveBeenCalledTimes(1))
  const [path,data,config]=vi.mocked(api.post).mock.calls[0]
  expect(path).toBe('/api/admin/before/import')
  expect(config).toEqual({headers:{'Content-Type':'multipart/form-data'}})
  expect((data as FormData).get('sourceKey')).toBe('before-mariokart')
  expect((data as FormData).get('replaceExisting')).toBe('false')
  expect(((data as FormData).get('file') as File).name).toBe('before.xlsx')
  expect(((data as FormData).get('file') as File).size).toBe(file.size)
  expect(await screen.findByRole('status',{name:'Bilan de l’import'})).toHaveTextContent('2 ligne(s) créée(s)')
})
