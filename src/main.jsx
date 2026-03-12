import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// LocalStorage ile storage API
window.storage = {
  get: async (key) => {
    const v = localStorage.getItem(key)
    return v ? { key, value: v } : null
  },
  set: async (key, value) => {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    return { key, value }
  },
  delete: async (key) => {
    localStorage.removeItem(key)
    return { key, deleted: true }
  },
  list: async (prefix = '') => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
    return { keys }
  }
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
