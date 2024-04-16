import { setSettingsLocation } from '@renderer/utils'
import { FirstRunState } from '@shared/types'
import { Dispatch, SetStateAction, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

type Props = {
  setFormState: Dispatch<SetStateAction<FirstRunState>>
  formState: FirstRunState
}

const GetLocation: React.FC<Props> = ({ formState, setFormState }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const tl = useRef({
    location: gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        setFormState({ ...formState, location: true })
      }
    })
  })

  useGSAP(
    () => {
      tl.current.location
        .from('.location-header', { autoAlpha: 0 })
        .from('.location-font', { autoAlpha: 0, stagger: 0.2 })
        .from('.location-button', { autoAlpha: 0 })
        .play()
    },

    { scope: ref }
  )

  return (
    <div ref={ref}>
      <h2 className="location-header">location</h2>
      <p className="location-font">
        As this is your first time using this software, we need to get a few settings from you.
      </p>
      <p className="location-font">First we need the location of your work folders.</p>
      <button className="location-button" onClick={() => setSettingsLocation(tl.current.location)}>
        Select directory
      </button>
    </div>
  )
}

export default GetLocation
