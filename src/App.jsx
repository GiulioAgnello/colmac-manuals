import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header     from './components/Header'
import SearchPage from './pages/SearchPage'
import DetailPage from './pages/DetailPage'
import LineaPage  from './pages/LineaPage'

export default function App({ apiUrl }) {
  return (
    <div className="cm-app">
      <Header />
      <Routes>
        <Route path="/"                element={<SearchPage apiUrl={apiUrl} />} />
        <Route path="/m/:modelId"      element={<DetailPage apiUrl={apiUrl} />} />
        <Route path="/linea/:lineaId"  element={<LineaPage  apiUrl={apiUrl} />} />
      </Routes>
    </div>
  )
}
