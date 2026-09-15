import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { PedidoWizardProvider } from './state/PedidoWizardContext.jsx'
import { PedidosProvider } from './state/PedidosContext.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PedidosProvider>
      <PedidoWizardProvider>
        <App />
      </PedidoWizardProvider>
    </PedidosProvider>
  </StrictMode>,
)
