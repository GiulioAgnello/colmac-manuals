import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const TIPO_LABEL = {
  manuale: "Manuale d'uso",
  esploso: 'Esploso',
}

const LINGUA_INFO = {
  it: { flag: '🇮🇹', label: 'Italiano' },
  en: { flag: '🇬🇧', label: 'English' },
  fr: { flag: '🇫🇷', label: 'Français' },
  es: { flag: '🇪🇸', label: 'Español' },
}

function DocTypeIcon({ tipo }) {
  if (tipo === 'esploso') {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="8"  width="40" height="6" rx="2" fill="#F5A623" opacity="0.9" />
        <rect x="12" y="20" width="40" height="6" rx="2" fill="#F5A623" opacity="0.6" />
        <rect x="12" y="32" width="40" height="6" rx="2" fill="#F5A623" opacity="0.4" />
        <rect x="12" y="44" width="40" height="6" rx="2" fill="#F5A623" opacity="0.2" />
        <line x1="32" y1="4" x2="32" y2="60" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="44" height="52" rx="3" fill="#f0f0f0" stroke="#ddd" strokeWidth="1.5" />
      <rect x="10" y="6" width="8"  height="52" rx="3" fill="#F5A623" opacity="0.8" />
      <line x1="24" y1="18" x2="48" y2="18" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="26" x2="48" y2="26" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="34" x2="48" y2="34" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="42" x2="40" y2="42" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function DetailPage({ apiUrl }) {
  const { modelId } = useParams()
  const navigate    = useNavigate()
  const [manuale, setManuale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true)
      try {
        const res  = await fetch(`${apiUrl}?q=${encodeURIComponent(modelId)}&per_page=1`)
        if (!res.ok) throw new Error()
        const data = await res.json()
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
    doFetch()
  }, [apiUrl, modelId])

  return (
    <>
      <header className="cm-header">
        <img
          src={window.colmacData?.logoUrl || ''}
          alt="Colmac Italia"
          className="cm-header__logo"
          onError={e => (e.target.style.display = 'none')}
        />
        <div className="cm-header__right">
          <p className="cm-header__title">Documentazione Tecnica</p>
          <p className="cm-header__sub">Manuali · Libretti · Schede tecniche</p>
        </div>
      </header>

      <div className="cm-main">

        {loading && (
          <div className="cm-detail-loading">
            <div className="cm-spinner-lg" />
          </div>
        )}

        {!loading && error && (
          <div className="cm-detail-error">
            <p className="cm-error">{error}</p>
            <button className="cm-btn-back" onClick={() => navigate('/')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Torna alla ricerca
            </button>
          </div>
        )}

        {!loading && manuale && (
          <>
            <div className="cm-step-nav">
              <button className="cm-btn-back" onClick={() => navigate(-1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Indietro
              </button>
            </div>

            <div className="cm-detail__header">
              <div>
                <h1 className="cm-detail__name">{manuale.nome}</h1>
                <code className="cm-detail__model-id">{manuale.model_id}</code>
              </div>
              <div className="cm-detail__badges">
                {manuale.linea && (
                  <span className="cm-badge cm-badge--linea">{manuale.linea}</span>
                )}
                {manuale.tipo_macchina && (
                  <span className="cm-badge cm-badge--tipo">{manuale.tipo_macchina}</span>
                )}
              </div>
            </div>

            {(!manuale.documenti || manuale.documenti.length === 0) ? (
              <p className="cm-detail__empty">Nessun documento disponibile.</p>
            ) : (
              <div className="cm-doc-cards-wrap">
                <div className="cm-doc-cards-count">
                  {manuale.documenti.length}{' '}
                  {manuale.documenti.length === 1 ? 'documento disponibile' : 'documenti disponibili'}
                </div>
                <div className="cm-doc-cards-grid">
                  {manuale.documenti.map((doc, i) => {
                    const lingua = LINGUA_INFO[doc.lingua] || { flag: '🌐', label: (doc.lingua || '').toUpperCase() }
                    const tipoLabel = TIPO_LABEL[doc.tipo] || doc.tipo || 'Documento'
                    return (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cm-doc-tile"
                      >
                        <div className="cm-doc-tile__icon">
                          <DocTypeIcon tipo={doc.tipo} />
                        </div>
                        <div className="cm-doc-tile__body">
                          <span className="cm-doc-tile__tipo">{tipoLabel}</span>
                          <span className="cm-doc-tile__lang">
                            <span className="cm-doc-tile__flag">{lingua.flag}</span>
                            {lingua.label}
                          </span>
                        </div>
                        <div className="cm-doc-tile__footer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Scarica PDF
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </>
  )
}
