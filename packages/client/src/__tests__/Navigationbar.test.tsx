import {beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import NavigationBar from '../components/Navigationbar'

describe('NavigationBar', () => {
    beforeEach(() => {
        vi.stubGlobal('matchMedia', vi.fn(() => ({
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })))
    })

    const renderNavigation = () => render(
        <MemoryRouter>
            <NavigationBar user={null} logout={vi.fn()} isAdmin={false} isModerator={false}/>
        </MemoryRouter>
    )

    it('opens the menu and closes it with Escape, restoring button focus', () => {
        renderNavigation()
        const toggle = screen.getByRole('button', {name: 'Ouvrir le menu'})
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(toggle)
        expect(toggle).toHaveAttribute('aria-expanded', 'true')
        const games = screen.getByRole('link', {name: 'Jeux'})
        games.focus()
        fireEvent.keyDown(games, {key: 'Escape'})
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
        expect(toggle).toHaveFocus()
    })

    it('closes after selecting a link, including the current page', () => {
        renderNavigation()
        const toggle = screen.getByRole('button', {name: 'Ouvrir le menu'})
        for (const name of ['Accueil', 'Jeux', 'Se connecter']) {
            fireEvent.click(toggle)
            fireEvent.click(screen.getByRole('link', {name}))
            expect(toggle).toHaveAttribute('aria-expanded', 'false')
        }
        expect(screen.queryByRole('link', {name: /Modération/})).not.toBeInTheDocument()
        expect(screen.queryByRole('link', {name: /Admin/})).not.toBeInTheDocument()
    })
})
