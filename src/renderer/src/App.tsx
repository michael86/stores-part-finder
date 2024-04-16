import { useEffect, useState } from 'react'
import FirstRun from './components/first_run/FirstRun'
import Dashboard from './components/Dashboard'

function App(): JSX.Element {
  const [firstRunComplete, setFirstRunComplete] = useState<boolean>(false)

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await window.context.getSettings()

      setFirstRunComplete(settings?.firstRunComplete ? true : false)
    }

    fetchSettings()
  })

  return <>{firstRunComplete ? <Dashboard /> : <FirstRun />}</>
}

export default App
