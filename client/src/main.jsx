import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'
import App from './App.jsx'

if (import.meta.env.PROD) {
  setTimeout(() => {
    console.log(
      '%cStop!',
      'color: red; font-size: 50px; font-weight: bold; text-shadow: 1px 1px 2px black;'
    );
    console.log(
      '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.',
      'font-size: 18px;'
    );
  }, 1000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
