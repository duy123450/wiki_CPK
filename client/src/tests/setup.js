// ── Lazy-load jest-dom matchers only for jsdom ────────────────────────────
if (typeof document !== 'undefined') {
    import('@testing-library/jest-dom')
}

// ── Mock browser APIs not available in jsdom ────────────────────────────────

// scrollTo
window.scrollTo = vi.fn()

// IntersectionObserver (used by MovieOverviewPage Reveal)
class MockIntersectionObserver {
    constructor(callback) {
        this._callback = callback
    }
    observe() {
        // Immediately trigger as intersecting for test simplicity
        this._callback([{ isIntersecting: true }])
    }
    unobserve() { }
    disconnect() { }
}
window.IntersectionObserver = MockIntersectionObserver

// URL.createObjectURL / revokeObjectURL (used by avatar upload)
if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn()
}

// matchMedia (used by some CSS-in-JS or responsive hooks)
window.matchMedia = window.matchMedia || vi.fn().mockReturnValue({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
})
