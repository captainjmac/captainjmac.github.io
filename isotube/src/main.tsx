import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {PlaylistsProvider} from './hooks/PlaylistsContext'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PlaylistsProvider>
            <App/>
        </PlaylistsProvider>
    </StrictMode>,
)
