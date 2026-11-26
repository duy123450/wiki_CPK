import { useState } from 'react'
import { useRefreshData } from '../hooks/useRefreshData'
import '../styles/AdminPage.css'

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
      className={`admin-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <div className="admin-page__content">
        <header className="admin-page__header">
          <p className="admin-page__eyebrow">Administration</p>
          <h1>Admin</h1>
        </header>

        <section className="admin-page__section" aria-labelledby="soundtrack-cache-heading">
          <h2 id="soundtrack-cache-heading">Soundtrack cache</h2>
          <p>Clear cached soundtrack data from the backend.</p>
          <button
            type="button"
            className="admin-page__button"
            onClick={handleClearCache}
            disabled={isLoading}
          >
            {isLoading ? 'Clearing…' : 'Clear soundtrack cache'}
          </button>

          {isLoading && <p role="status">Clearing the soundtrack cache…</p>}
          {requestState === 'success' && (
            <p role="status">Soundtrack cache cleared successfully.</p>
          )}
          {requestState === 'error' && (
            <p role="alert">
              Could not clear the soundtrack cache. Please try again.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
