import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar  from '../components/SearchBar'
import FilterBar  from '../components/FilterBar'
import EmptyState from '../components/EmptyState'

const DEBOUNCE_MS = 350

function DocTypeIcon({ tipo }) {
  if (tipo === 'esploso') {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="8"  width="40" height="6"  rx="2" fill="#F5A623" opacity="0.9"/>
        <rect x="12" y="20" width="40" height="6"  rx="2" fill="#F5A623" opacity="0.6"/>
        <rect x="12" y="32" width="40" height="6"  rx="2" fill="#F5A623" opacity="0.4"/>
        <rect x="12" y="44" width="40" height="6"  rx="2" fill="#F5A623" opacity="0.2"/>
        <line x1="32" y1="4" x2="32" y2="60" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4"/>
      </svg>
    )
  }
  // default: manuale / montaggio
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

  const [query,        setQuery]        = useState('')
  const [linea,        setLinea]        = useState('')
  const [tipoMacchina, setTipoMacchina] = useState('')
  const [tipoDoc,      setTipoDoc]      = useState('')
  const [lang,         setLang]         = useState('')

  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [searched, setSearched] = useState(false)

  const fetchManuali = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (query)        params.set('q',             query)
    if (linea)        params.set('linea',         linea)
    if (tipoMacchina) params.set('tipo_macchina', tipoMacchina)
    if (tipoDoc)      params.set('tipo_doc',      tipoDoc)
    if (lang)         params.set('lang',          lang)
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
  }, [apiUrl, query, linea, tipoMacchina, tipoDoc, lang])

  useEffect(() => {
    const t = setTimeout(fetchManuali, query ? DEBOUNCE_MS : 0)
    return () => clearTimeout(t)
  }, [fetchManuali])

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

        {/* Hero search */}
        <div className="cm-hero">
          <h1 className="cm-hero__title">Trova il tuo modello</h1>
          <p className="cm-hero__sub">Inserisci il codice del tuo macchinario per trovare i documenti disponibili</p>

          <SearchBar value={query} onChange={setQuery} loading={loading} />

          <FilterBar
            linea={linea}            onLineaChange={setLinea}
            tipoMacchina={tipoMacchina} onTipoMacchinaChange={setTipoMacchina}
            tipoDoc={tipoDoc}        onTipoDocChange={setTipoDoc}
            lang={lang}              onLangChange={setLang}
          />
        </div>

        {error && <p className="cm-error">{error}</p>}

        {!loading && searched && results.length === 0 && !error && (
          <EmptyState query={query} />
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

      </div>
    </>
  )
}
