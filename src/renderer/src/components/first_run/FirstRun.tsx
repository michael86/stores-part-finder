import { useRef, useState } from 'react'
import '../../styles/first_run.css'
import GetLocation from './GetLocation'
import GetTemplate from './GetTemplate'

const FirstRun = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [formState, setFormState] = useState({ location: false, template: false })

  return (
    <div ref={ref} className="first-run-container">
      {!formState.location ? (
        <GetLocation setFormState={setFormState} formState={formState} />
      ) : (
        <GetTemplate setFormState={setFormState} formState={formState} />
      )}
    </div>
  )
}

export default FirstRun
