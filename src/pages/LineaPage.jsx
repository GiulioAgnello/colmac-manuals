import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SearchBar  from '../components/SearchBar'
import EmptyState from '../components/EmptyState'

const LANGS = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
]

function DocTypeIcon({ tipo }) {
  if (tipo === 'esploso') {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="8"  width="40" height="6" rx="2" fill="#F5A623" opacity="0.9"/>
        <rect x="12" y="20" width="40" height="6" rx="2" fill="#F5A623" opacity="0.6"/>
        <rect x="12" y="32" width="40" height="6" rx="2" fill="#F5A623" opacity="0.4"/>
        <rect x="12" y="44" width="40" height="6" rx="2" fill="#F5A623" opacity="0.2"/>
        <line x1="32" y1="4" x2="32" y2="60" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="44" height="52" rx="3" fill="#f0f0f0" stroke="#ddd" strokeWidth="1.5"/>
      <rect x="10" y="6" width="8"  height="52" rx="3" fill="#F5A623" opacity="0.8"/>
      <line x1="24" y1="18" x2="48" y2="18" stroke="#ccc" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="26" x2="48" y2="26" stroke="#ccc" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="34" x2="48" y2="34" stroke="#ccc" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="42" x2="40" y2="42" stroke="#ccc" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function LineaPage({ apiUrl }) {
  const { lineaId } = useParams()
  const navigate    = useNavigate()

  const [step,           setStep]           = useState('lang') // lang | results
  const [selectedLang,   setSelectedLang]   = useState(null)
  const [results,        setResults]        = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [searched,       setSearched]       = useState(false)
  const [lineaLabel,     setLineaLabel]     = useState(lineaId)

  // Recupera il nome display della linea dalla REST API
  useEffect(() => {
    fetch( `/wp-json/wp/v2/colmac_linea?slug=${lineaId}` )
      .then( r => r.json() )
      .then( data => { if ( data[0]?.name ) setLineaLabel( data[0].name ) } )
      .catch( () => {} )
  }, [lineaId])

  const fetchResults = useCallback( async (lang) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ linea: lineaId, lang })
      const res    = await fetch(`${apiUrl}?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data   = await res.json()
      setResults(data)
      setSearched(true)
    } catch {
      setError('Impossibile caricare i risultati. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, lineaId])

  const handleLangClick = (lang) => {
    setSelectedLang(lang)
    setStep('results')
    fetchResults(lang)
  }

  const goBack = () => {
    if (step === 'results') {
      setStep('lang')
      setSelectedLang(null)
      setResults([])
      setSearched(false)
    } else {
      navigate('/')
    }
  }

  const selectedLangObj = LANGS.find(l => l.code === selectedLang)

  return (
    <>
      <header className="cm-header">
        <img
          src={window.colmacData?.logoUrl || ''}
          alt="Colmac Italia"
          className="cm-header__logo"
          onError={e => e.target.style.display = 'none'}
        />
        <div className="cm-header__right">
          <p className="cm-header__title">Documentazione Tecnica</p>
          <p className="cm-header__sub">Manuali · Libretti · Schede tecniche</p>
        </div>
      </header>

      <div className="cm-main">

        {/* ── STEP: LINGUA ── */}
        {step === 'lang' && (
          <>
            <button className="cm-btn-back" onClick={goBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Indietro
            </button>
            <div className="cm-step-wrap">
              <p className="cm-step-title">
                Seleziona la lingua per <strong style={{textTransform:'capitalize'}}>{lineaLabel}</strong>
              </p>
              <div className="cm-lang-grid">
                {LANGS.map(lang => (
                  <button
                    key={lang.code}
                    className="cm-lang-tile"
                    onClick={() => handleLangClick(lang.code)}
                  >
                    <span className="cm-lang-tile__flag">{lang.flag}</span>
                    <span className="cm-lang-tile__label">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── STEP: RISULTATI ── */}
        {step === 'results' && (
          <>
            <div className="cm-step-nav">
              <button className="cm-btn-back" onClick={goBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Indietro
              </button>
              <span className="cm-step-crumb" style={{textTransform:'capitalize'}}>
                {lineaLabel} · {selectedLangObj?.flag} {selectedLangObj?.label}
              </span>
            </div>

            {error && <p className="cm-error">{error}</p>}

            {loading && (
              <div className="cm-detail-loading"><div className="cm-spinner-lg"/></div>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <EmptyState />
            )}

            {results.length > 0 && (
              <div className="cm-results-wrap">
                <div className="cm-results-count">
                  {results.length} {results.length === 1 ? 'modello trovato' : 'modelli trovati'}
                </div>
                <div className="cm-results">
                  {results.map(item => (
                    <div
                      key={item.id}
                      className="cm-result-card"
                      onClick={() => navigate(`/m/${item.model_id}`)}
                    >
                      <div className="cm-result-card__icon-wrap">
                        <DocTypeIcon tipo={item.documenti?.[0]?.tipo} />
                      </div>
                      <div className="cm-result-card__top">
                        <span className="cm-result-card__model">{item.model_id}</span>
                        <svg className="cm-result-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                      <span className="cm-result-card__name">{item.nome}</span>
                      <div className="cm-result-card__badges">
                        {item.linea         && <span className="cm-badge cm-badge--linea">{item.linea}</span>}
                        {item.tipo_macchina && <span className="cm-badge cm-badge--tipo">{item.tipo_macchina}</span>}
                        <span className="cm-badge cm-badge--count">
                          {item.documenti?.length || 0} doc
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </>
  )
}
