import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {PlaylistsProvider} from './hooks/PlaylistsContext'
import {ToastProvider} from './hooks/useToast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlaylistsProvider>
      <ToastProvider>
        <App/>
      </ToastProvider>
    </PlaylistsProvider>
  </StrictMode>,
)
