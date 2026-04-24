import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const TIPO_LABEL = {
  libretto_assistenza: 'Libretto Assistenza',
  catalogo:            'Catalogo',
  esploso:             'Esploso',
  dichiarazione_ce:    'Dichiarazione CE',
  scheda_tecnica:      'Scheda Tecnica',
}

const LINGUA_LABEL = {
  it: '🇮🇹 Italiano',
  en: '🇬🇧 English',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
  es: '🇪🇸 Español',
  pt: '🇵🇹 Português',
}

function groupByTipo(documenti) {
  return documenti.reduce((acc, doc) => {
    const k = doc.tipo || 'altro'
    if (!acc[k]) acc[k] = []
    acc[k].push(doc)
    return acc
  }, {})
}

export default function DetailPage({ apiUrl }) {
  const { modelId } = useParams()
  const navigate    = useNavigate()

  const [manuale, setManuale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true)
      try {
        const res  = await fetch(`${apiUrl}?q=${encodeURIComponent(modelId)}&per_page=1`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        // Trova corrispondenza esatta per model_id
        const found = data.find(m => m.model_id === modelId)
        if (!found) throw new Error('not_found')
        setManuale(found)
      } catch (err) {
        setError(err.message === 'not_found'
          ? `Nessun manuale trovato per il modello "${modelId}".`
          : 'Errore nel caricamento. Riprova più tardi.'
        )
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [apiUrl, modelId])

  if (loading) return (
    <div className="cm-detail-loading">
      <div className="cm-spinner-lg" />
      <p>Caricamento in corso…</p>
    </div>
  )

  if (error) return (
    <div className="cm-detail-error">
      <p className="cm-error">{error}</p>
      <button className="cm-btn-back" onClick={() => navigate('/')}>
        ← Torna alla ricerca
      </button>
    </div>
  )

  const grouped = groupByTipo(manuale.documenti || [])

  return (
    <div className="cm-detail">

      {/* Back */}
      <button className="cm-btn-back" onClick={() => navigate('/')}>
        ← Tutti i modelli
      </button>

      {/* Header modello */}
      <div className="cm-detail__header">
        <div>
          <h1 className="cm-detail__name">{manuale.nome}</h1>
          <code className="cm-detail__model-id">{manuale.model_id}</code>
        </div>
        <div className="cm-detail__badges">
          {manuale.linea         && <span className="cm-badge cm-badge--linea">{manuale.linea}</span>}
          {manuale.tipo_macchina && <span className="cm-badge cm-badge--tipo">{manuale.tipo_macchina}</span>}
        </div>
      </div>

      {/* Documenti */}
      {Object.keys(grouped).length === 0 ? (
        <p className="cm-detail__empty">Nessun documento disponibile per questo modello.</p>
      ) : (
        <div className="cm-detail__docs">
          {Object.entries(grouped).map(([tipo, docs]) => (
            <div key={tipo} className="cm-doc-section">
              <h2 className="cm-doc-section__title">
                {TIPO_LABEL[tipo] || tipo}
              </h2>
              <div className="cm-doc-section__grid">
                {docs.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cm-doc-card"
                  >
                    <div className="cm-doc-card__icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="cm-doc-card__info">
                      <span className="cm-doc-card__lang">
                        {LINGUA_LABEL[doc.lingua] || doc.lingua?.toUpperCase()}
                      </span>
                      <span className="cm-doc-card__filename">{doc.filename}</span>
                    </div>
                    <div className="cm-doc-card__download">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
