import './AppLoading.css'

function AppLoading() {
  return (
    <main className="app-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="app-loading-content">
        <div className="app-loading-brand" aria-label="Cora">
          <span className="app-loading-brand-mark" aria-hidden="true">c</span>
          <span>Cora</span>
        </div>

        <div className="app-loading-activity" aria-hidden="true">
          <span className="app-loading-spinner" />
          <span className="app-loading-spinner-core" />
        </div>

        <div className="app-loading-copy">
          <h1>Preparando seu espaço</h1>
          <p>Verificando seu acesso para abrir o painel.</p>
        </div>

        <div className="app-loading-track" aria-hidden="true">
          <span />
        </div>
      </div>
    </main>
  )
}

export default AppLoading