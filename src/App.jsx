import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SearchPage from './pages/SearchPage'
import DetailPage from './pages/DetailPage'

export default function App({ apiUrl }) {
  return (
    <div className="cm-app">
      <Routes>
        <Route path="/"           element={<SearchPage apiUrl={apiUrl} />} />
        <Route path="/m/:modelId" element={<DetailPage apiUrl={apiUrl} />} />
      </Routes>
    </div>
  )
}
