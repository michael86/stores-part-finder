import './styles/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

//Register useGsap for all components
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(useGSAP)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
