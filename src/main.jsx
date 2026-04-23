import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('colmac-manuali-app')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App
        apiUrl={window.colmacData?.apiUrl || '/wp-json/colmac/v1/manuali'}
        presetLinea={container.dataset.linea || ''}
      />
    </React.StrictMode>
  )
}
