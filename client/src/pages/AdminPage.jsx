import { useState } from 'react'
import { useRefreshData } from '../hooks/useRefreshData'

export default function AdminPage({ sidebarCollapsed }) {
  const { clearServerCache } = useRefreshData()
  const [requestState, setRequestState] = useState('idle')

  const handleClearCache = async () => {
    setRequestState('loading')

    try {
      await clearServerCache(null)
      setRequestState('success')
    } catch {
      setRequestState('error')
    }
  }

  const isLoading = requestState === 'loading'

  return (
    <main
      className={`box-border min-h-[100dvh] bg-[#060714] font-['Source_Sans_3',sans-serif] text-[#f6f0ff] transition-[width,margin-left] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        sidebarCollapsed
          ? 'ml-0 w-full'
          : 'ml-[var(--sidebar-current-width,260px)] w-[calc(100%-var(--sidebar-current-width,260px))]'
      } px-[clamp(16px,5vw,56px)] pt-[clamp(32px,5vw,60px)] pb-20`}
    >
      <div className="mx-auto w-full max-w-[760px]">
        <header className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#c084fc]">
            Administration
          </p>
          <h1
            className="m-0 font-['Inter',sans-serif] text-[clamp(28px,4vw,36px)]"
          >
            Admin
          </h1>
        </header>

        <section
          className="rounded-2xl border border-solid border-[rgba(192,132,252,0.18)] bg-[rgba(12,15,31,0.7)] p-6"
          aria-labelledby="soundtrack-cache-heading"
        >
          <h2
            id="soundtrack-cache-heading"
            className="mb-2 mt-0 font-['Inter',sans-serif] text-[1.2rem]"
          >
            Soundtrack cache
          </h2>
          <p className="text-[rgba(246,240,255,0.72)]">
            Clear cached soundtrack data from the backend.
          </p>
          <button
            type="button"
            className="rounded-lg border border-solid border-[rgba(192,132,252,0.45)] bg-[rgba(192,132,252,0.14)] px-4 py-2.5 font-[inherit] text-[#f6f0ff] cursor-pointer hover:bg-[rgba(192,132,252,0.24)] disabled:cursor-wait disabled:opacity-[0.65] disabled:hover:bg-[rgba(192,132,252,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#c084fc]"
            onClick={handleClearCache}
            disabled={isLoading}
          >
            {isLoading ? 'Clearing…' : 'Clear soundtrack cache'}
          </button>

          {isLoading && (
            <p role="status" className="text-[rgba(246,240,255,0.72)]">
              Clearing the soundtrack cache…
            </p>
          )}
          {requestState === 'success' && (
            <p role="status" className="text-[rgba(246,240,255,0.72)]">
              Soundtrack cache cleared successfully.
            </p>
          )}
          {requestState === 'error' && (
            <p role="alert" className="text-[rgba(246,240,255,0.72)]">
              Could not clear the soundtrack cache. Please try again.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
