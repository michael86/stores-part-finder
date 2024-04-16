import { AddTableHeader, SetSettingsLocationUtil } from '@shared/types'

export const setSettingsLocation: SetSettingsLocationUtil = async (tl) => {
  const saved = await window.context.setSettingsLocation()
  if (!saved || !tl) return
  tl.reverse() //We set the state for the form within the timeline
}

/** Will add a new table header, normally only used when updating user template settings */
export const addTableHeader: AddTableHeader = (headers, setHeaders, newHeader) => {
  const newHeaderLower = newHeader.toLowerCase()
  if (headers.includes(newHeaderLower) || newHeaderLower.length <= 0) return
  setHeaders([...headers, newHeaderLower])
}
