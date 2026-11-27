import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useCharacter } from '@/hooks/useCharacter'
import CharacterPage from '@/pages/CharacterPage'

vi.mock('@/hooks/useCharacter', () => ({
  useCharacter: vi.fn(),
}))

const character = {
  name: 'Kaguya',
  role: 'Protagonist',
  image: [
    { url: '/kaguya-real.png' },
    { url: '/kaguya-tsukuyomi.png' },
  ],
  voiceActor: 'Test Voice Actor',
  description: {
    summary: 'A princess from the moon.',
    personality: 'Curious and kind.',
    appearance: {
      realWorld: 'Human form',
      tsukuyomi: 'Moon form',
    },
  },
  abilities: [
    {
      skillName: 'Crescent Strike',
      type: 'Active',
      effects: ['A bright slash'],
    },
  ],
  relationships: [
    {
      targetId: {
        name: 'Iroha',
        image: [{ url: '/iroha.png' }],
      },
      relationType: 'Friend',
      description: 'Trusted companion',
    },
  ],
}

const renderPage = () => {
  useCharacter.mockReturnValue({ character, loading: false, error: null })
  return render(
    <MemoryRouter initialEntries={['/wiki/characters/kaguya']}>
      <Routes>
        <Route
          path="/wiki/characters/:slug"
          element={<CharacterPage sidebarCollapsed={false} />}
        />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('CharacterPage', () => {
  it('renders character details, abilities, and linked relationships', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Kaguya' })).toBeInTheDocument()
    expect(screen.getByText('A princess from the moon.')).toBeInTheDocument()
    expect(screen.getByText('Crescent Strike')).toBeInTheDocument()
    expect(screen.getByText('A bright slash')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Iroha/ })).toHaveAttribute(
      'href',
      '/wiki/characters/iroha'
    )
  })

  it('keeps ImageSwitcher styling hooks and its 260 ms fade behavior', async () => {
    vi.useFakeTimers()
    renderPage()

    expect(document.querySelectorAll('.chr-img-corner')).toHaveLength(4)
    expect(screen.getByAltText('character view 1')).toHaveClass(
      'chr-img-main',
      'chr-img-fade-in'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Tsukuyomi' }))
    expect(screen.getByAltText('character view 1')).toHaveClass(
      'chr-img-fade-out'
    )

    await act(async () => {
      vi.advanceTimersByTime(260)
    })

    expect(screen.getByAltText('character view 2')).toHaveClass(
      'chr-img-fade-in'
    )
  })
})
