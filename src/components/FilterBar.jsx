import React from 'react'

const TIPI_MACCHINA = [
  { value: '',               label: 'Tutte le categorie' },
  { value: 'Motocarriole',   label: 'Motocarriole' },
  { value: 'Mini Dumper',    label: 'Mini Dumper' },
  { value: 'Miniescavatori', label: 'Miniescavatori' },
  { value: 'Minipale',       label: 'Minipale' },
  { value: 'Betoniere',      label: 'Betoniere' },
  { value: 'Mescolatori',    label: 'Mescolatori' },
  { value: 'Martelli',       label: 'Martelli' },
]

const TIPI_DOC = [
  { value: '',                    label: 'Tutti i documenti' },
  { value: 'libretto_assistenza', label: 'Libretto Assistenza' },
  { value: 'catalogo',            label: 'Catalogo' },
  { value: 'esploso',             label: 'Esploso' },
  { value: 'dichiarazione_ce',    label: 'Dichiarazione CE' },
  { value: 'scheda_tecnica',      label: 'Scheda Tecnica' },
]

const LINGUE = [
  { value: '', label: 'Tutte le lingue' },
  { value: 'it', label: '🇮🇹 Italiano' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'pt', label: '🇵🇹 Português' },
]

function Select({ value, onChange, options, label }) {
  return (
    <label className="cm-filter__item">
      <span className="cm-filter__label">{label}</span>
      <select className="cm-filter__select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export default function FilterBar({
  tipoMacchina, onTipoMacchinaChange,
  tipoDoc,      onTipoDocChange,
  lang,         onLangChange,
  linea,        onLineaChange,
}) {
  const hasFilters = tipoMacchina || tipoDoc || lang

  return (
    <div className="cm-filterbar">
      <Select label="Categoria"   value={tipoMacchina} onChange={onTipoMacchinaChange} options={TIPI_MACCHINA} />
      <Select label="Documento"   value={tipoDoc}      onChange={onTipoDocChange}      options={TIPI_DOC} />
      <Select label="Lingua"      value={lang}         onChange={onLangChange}         options={LINGUE} />
      {hasFilters && (
        <button className="cm-filterbar__reset" onClick={() => {
          onTipoMacchinaChange('')
          onTipoDocChange('')
          onLangChange('')
        }}>
          ✕ Reset
        </button>
      )}
    </div>
  )
}
