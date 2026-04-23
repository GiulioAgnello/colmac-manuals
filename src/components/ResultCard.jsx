import React, { useState } from 'react'

const TIPO_LABEL = {
  libretto_assistenza: 'Libretto Assistenza',
  catalogo:            'Catalogo',
  esploso:             'Esploso',
  dichiarazione_ce:    'Dichiarazione CE',
  scheda_tecnica:      'Scheda Tecnica',
}

const LINGUA_LABEL = {
  it: '🇮🇹 IT',
  en: '🇬🇧 EN',
  fr: '🇫🇷 FR',
  de: '🇩🇪 DE',
  es: '🇪🇸 ES',
  pt: '🇵🇹 PT',
}

// Raggruppa documenti per tipo
function groupByTipo(documenti) {
  return documenti.reduce((acc, doc) => {
    const k = doc.tipo || 'altro'
    if (!acc[k]) acc[k] = []
    acc[k].push(doc)
    return acc
  }, {})
}

export default function ResultCard({ manuale }) {
  const [open, setOpen] = useState(false)
  const grouped = groupByTipo(manuale.documenti || [])

  return (
    <article className={`cm-card ${open ? 'cm-card--open' : ''}`}>
      <header className="cm-card__header" onClick={() => setOpen(o => !o)}>
        <div className="cm-card__meta">
          <span className="cm-card__model-id">{manuale.model_id}</span>
          <span className="cm-card__nome">{manuale.nome}</span>
        </div>
        <div className="cm-card__badges">
          {manuale.linea        && <span className="cm-badge cm-badge--linea">{manuale.linea}</span>}
          {manuale.tipo_macchina && <span className="cm-badge cm-badge--tipo">{manuale.tipo_macchina}</span>}
          <span className="cm-badge cm-badge--count">{manuale.documenti?.length || 0} doc</span>
        </div>
        <button
          className="cm-card__toggle"
          aria-expanded={open}
          aria-label={open ? 'Chiudi' : 'Apri'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
        </button>
      </header>

      {open && (
        <div className="cm-card__body">
          {Object.entries(grouped).map(([tipo, docs]) => (
            <div key={tipo} className="cm-doc-group">
              <h4 className="cm-doc-group__title">
                {TIPO_LABEL[tipo] || tipo}
              </h4>
              <div className="cm-doc-group__links">
                {docs.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cm-doc-link"
                    download
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {LINGUA_LABEL[doc.lingua] || doc.lingua.toUpperCase()}
                    <span className="cm-doc-link__filename">{doc.filename}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
