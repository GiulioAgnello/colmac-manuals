import React from 'react'

export default function EmptyState({ query }) {
  return (
    <div className="cm-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
      <p className="cm-empty__title">
        {query
          ? <>Nessun risultato per <strong>"{query}"</strong></>
          : 'Nessun manuale trovato con i filtri selezionati'
        }
      </p>
      <p className="cm-empty__hint">
        Prova a controllare il codice modello o modifica i filtri.
      </p>
    </div>
  )
}
