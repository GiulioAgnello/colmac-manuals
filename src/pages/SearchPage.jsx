import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar  from '../components/SearchBar'
import EmptyState from '../components/EmptyState'

const DEBOUNCE_MS = 350

const MACRO_LINES = [
  { id: 'tucano',    label: 'Tucano',    linea: 'Tucano',    image: null },
  { id: 'pellicano', label: 'Pellicano', linea: 'Pellicano', image: null },
  { id: 'betomix',   label: 'BetoMix',   linea: 'BetoMix',   image: null },
  { id: 'airone',    label: 'Airone',    linea: 'Airone',    image: null },
]

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

export default function SearchPage({ apiUrl }) {
  const navigate = useNavigate()

  // Wizard
  const [step,          setStep]          = useState('home') // home | lang | results | search
  const [selectedLinea, setSelectedLinea] = useState(null)
  const [selectedLang,  setSelectedLang]  = useState(null)

  // Search libera
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [searched, setSearched] = useState(false)

  const fetchResults = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${apiUrl}?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(data)
      setSearched(true)
    } catch {
      setError('Impossibile caricare i risultati. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  // Search libera con debounce
  useEffect(() => {
    if (!query) {
      if (step === 'search') {
        setStep('home')
        setResults([])
        setSearched(false)
      }
      return
    }
    const t = setTimeout(() => {
      setStep('search')
      fetchResults(new URLSearchParams({ q: query }))
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  // Fetch per linea + lingua
  useEffect(() => {
    if (step !== 'results' || !selectedLinea || !selectedLang) return
    fetchResults(new URLSearchParams({ linea: selectedLinea, lang: selectedLang }))
  }, [step, selectedLinea, selectedLang])

  const handleLineaClick = (linea) => {
    setSelectedLinea(linea)
    setResults([])
    setSearched(false)
    setStep('lang')
  }

  const handleLangClick = (lang) => {
    setSelectedLang(lang)
    setStep('results')
  }

  const goBack = () => {
    if (step === 'results') {
      setStep('lang')
      setResults([])
      setSearched(false)
    } else if (step === 'lang') {
      setStep('home')
      setSelectedLinea(null)
    }
  }

  const selectedLineaObj = MACRO_LINES.find(l => l.linea === selectedLinea)
  const selectedLangObj  = LANGS.find(l => l.code === selectedLang)

  return (
    <>
      {/* Header */}
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

        {/* Search sempre visibile */}
        <div className="cm-hero">
          <h1 className="cm-hero__title">Trova il tuo modello</h1>
          <p className="cm-hero__sub">Inserisci il codice del tuo macchinario per trovare i documenti disponibili</p>
          <SearchBar value={query} onChange={setQuery} loading={loading && step === 'search'} />
        </div>

        {error && <p className="cm-error">{error}</p>}

        {/* ── STEP: HOME ── */}
        {step === 'home' && (
          <div className="cm-lines-wrap">
            <p className="cm-lines-label">Oppure scegli la tua linea</p>
            <div className="cm-lines-grid">
              {MACRO_LINES.map(line => (
                <button
                  key={line.id}
                  className="cm-line-tile"
                  onClick={() => handleLineaClick(line.linea)}
                >
                  <div className="cm-line-tile__img-wrap">
                    {line.image
                      ? <img src={line.image} alt={line.label} className="cm-line-tile__img" />
                      : <span className="cm-line-tile__placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </span>
                    }
                  </div>
                  <div className="cm-line-tile__footer">
                    <span className="cm-line-tile__label">{line.label}</span>
                    <svg className="cm-line-tile__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: LINGUA ── */}
        {step === 'lang' && (
          <div className="cm-step-wrap">
            <button className="cm-btn-back" onClick={goBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Indietro
            </button>
            <p className="cm-step-title">
              Seleziona la lingua per <strong>{selectedLineaObj?.label}</strong>
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
        )}

        {/* ── STEP: RISULTATI (linea+lingua) ── */}
        {step === 'results' && (
          <>
            <div className="cm-step-nav">
              <button className="cm-btn-back" onClick={goBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Indietro
              </button>
              <span className="cm-step-crumb">
                {selectedLineaObj?.label} · {selectedLangObj?.flag} {selectedLangObj?.label}
              </span>
            </div>
            {loading && (
              <div className="cm-detail-loading"><div className="cm-spinner-lg"/></div>
            )}
            {!loading && searched && results.length === 0 && !error && (
              <EmptyState />
            )}
            {results.length > 0 && <ResultsGrid results={results} navigate={navigate} />}
          </>
        )}

        {/* ── STEP: SEARCH LIBERA ── */}
        {step === 'search' && (
          <>
            {loading && (
              <div className="cm-detail-loading"><div className="cm-spinner-lg"/></div>
            )}
            {!loading && searched && results.length === 0 && !error && (
              <EmptyState query={query} />
            )}
            {results.length > 0 && <ResultsGrid results={results} navigate={navigate} />}
          </>
        )}

      </div>
    </>
  )
}

function ResultsGrid({ results, navigate }) {
  return (
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
  )
}
