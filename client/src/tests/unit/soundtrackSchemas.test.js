import { describe, expect, it } from 'vitest'
import { trackSchema } from '@/schemas/soundtrackSchemas'

describe('soundtrack schemas', () => {
  it('parses Japanese lyrics and synchronized Japanese lines', () => {
    const track = trackSchema.parse({
      lyrics: {
        japanese: '日本語のテスト',
        synced: [{ time: 5, line: 'romaji sample', lineJapanese: '同期テスト' }],
      },
    })

    expect(track.lyrics.japanese).toBe('日本語のテスト')
    expect(track.lyrics.synced[0].lineJapanese).toBe('同期テスト')
  })

  it('defaults absent Japanese lyrics safely for existing tracks', () => {
    const track = trackSchema.parse({ lyrics: { romaji: 'romaji sample' } })

    expect(track.lyrics.japanese).toBe('')
    expect(track.lyrics.romaji).toBe('romaji sample')
    expect(track.lyrics.synced).toEqual([])
  })

  it('normalizes null Japanese fields without dropping other lyrics', () => {
    const track = trackSchema.parse({
      lyrics: {
        japanese: null,
        romaji: 'romaji sample',
        synced: [{ time: 5, line: 'romaji line', lineJapanese: null }],
      },
    })

    expect(track.lyrics.japanese).toBe('')
    expect(track.lyrics.romaji).toBe('romaji sample')
    expect(track.lyrics.synced[0].lineJapanese).toBe('')
  })
})
