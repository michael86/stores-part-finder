import { FirstRunState } from '@shared/types'
import { Dispatch, SetStateAction, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { addTableHeader } from '@renderer/utils'

type Props = {
  setFormState: Dispatch<SetStateAction<FirstRunState>>
  formState: FirstRunState
}

const GetTemplate: React.FC<Props> = ({ setFormState, formState }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [userState, setUserState] = useState('')
  const tl = useRef<GSAPTimeline>(
    gsap.timeline({ onReverseComplete: () => setFormState({ ...formState, template: true }) })
  )

  useGSAP(
    () => {
      tl.current
        .from('h2', { autoAlpha: 0 })
        .from('p', { autoAlpha: 0, stagger: 0.2 })
        .from('button', { autoAlpha: 0 })
    },
    { scope: ref }
  )

  const setValue = (e: React.ChangeEvent<HTMLInputElement>) => setUserState(e.target.value)

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.toLowerCase() === 'enter' && userState.length > 0) {
      const newHeaderLower = userState.toLowerCase()
      if (headers.includes(newHeaderLower)) return
      setHeaders([...headers, newHeaderLower])
      setUserState('')
    }
  }

  const onDelete = (index: number) => {
    headers.splice(index, 1)
    setHeaders([...headers])
  }

  const onSave = async () => {
    if (!headers.length) return

    const saved = await window.context.setSettingsTemplate(headers)
    if (!saved) return
    tl.current.reverse()
    await window.context.setSettingsFirstRunComplete()
  }

  return (
    <div className="template-container" ref={ref}>
      <h2 className="template-header">Template</h2>
      <p className="templateFont">Now we need the template for your spreadsheets.</p>
      <p className="templateFont">This is typically a row of headers.</p>
      <p className="templateFont">Don't worry about the columns/rows/capitalization.</p>
      <input
        type="text"
        placeholder="Header Name"
        value={userState}
        onChange={setValue}
        onKeyUp={onKeyUp}
      />
      <button onClick={() => addTableHeader(headers, setHeaders, userState)}>Add Header</button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {headers.map((row, index) => (
            <tr key={index}>
              <td>{row}</td>
              <td>
                <button onClick={() => onDelete(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={onSave}>Save</button>
    </div>
  )
}

export default GetTemplate
