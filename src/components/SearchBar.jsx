import React from 'react'

export default function SearchBar({ value, onChange, loading }) {
  return (
    <div className="cm-searchbar">
      <div className="cm-searchbar__inner">
        <span className="cm-searchbar__icon" aria-hidden="true">
          {loading
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          }
        </span>
        <input
          type="search"
          className="cm-searchbar__input"
          placeholder="Inserisci il codice modello (es. BETOMIX-350RS)..."
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        {value && (
          <button
            className="cm-searchbar__clear"
            onClick={() => onChange('')}
            aria-label="Cancella ricerca"
          >×</button>
        )}
      </div>
    </div>
  )
}
