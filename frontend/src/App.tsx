import { useState } from 'react'
// IMPORTANTE: Aquí NO debe haber ningún "import './App.css'"
import LoginPage from './pages/LoginPage/LoginPage'
import MeetupPage from './pages/MeetUp/MeetupPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <MeetupPage />
      )}
    </>
  )
}

export default App