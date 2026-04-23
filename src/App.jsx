import React, { useState, useEffect, useCallback } from 'react'
import SearchBar   from './components/SearchBar'
import FilterBar   from './components/FilterBar'
import ResultCard  from './components/ResultCard'
import EmptyState  from './components/EmptyState'

const DEBOUNCE_MS = 350

export default function App({ apiUrl, presetLinea = '' }) {
  const [query,        setQuery]        = useState('')
  const [linea,        setLinea]        = useState(presetLinea)
  const [tipoMacchina, setTipoMacchina] = useState('')
  const [tipoDoc,      setTipoDoc]      = useState('')
  const [lang,         setLang]         = useState('')

  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [searched, setSearched] = useState(false)

  // Fetch con debounce sulla query testuale
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
      if (!res.ok) throw new Error(`Errore ${res.status}`)
      const data = await res.json()
      setResults(data)
      setSearched(true)
    } catch (err) {
      setError('Impossibile caricare i risultati. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, query, linea, tipoMacchina, tipoDoc, lang])

  // Debounce sulla query testuale; i filtri dropdown sono immediati
  useEffect(() => {
    const timer = setTimeout(fetchManuali, query ? DEBOUNCE_MS : 0)
    return () => clearTimeout(timer)
  }, [fetchManuali])

  return (
    <div className="cm-app">
      <SearchBar
        value={query}
        onChange={setQuery}
        loading={loading}
      />

      <FilterBar
        linea={linea}            onLineaChange={setLinea}
        tipoMacchina={tipoMacchina} onTipoMacchinaChange={setTipoMacchina}
        tipoDoc={tipoDoc}        onTipoDocChange={setTipoDoc}
        lang={lang}              onLangChange={setLang}
      />

      {error && (
        <p className="cm-error">{error}</p>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <EmptyState query={query} />
      )}

      {results.length > 0 && (
        <div className="cm-results">
          {results.map(item => (
            <ResultCard key={item.id} manuale={item} />
          ))}
        </div>
      )}
    </div>
  )
}
