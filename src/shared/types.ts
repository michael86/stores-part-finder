import { Dispatch, SetStateAction } from 'react'

/**
 * Main types, may be shared with rendered but typically found in the main or prelaod scripts
 */
export type GetDir = (dir: string) => string
export type Settings = {
  directory?: string
  template?: string[]
  firstRunComplete?: boolean
}
export type GetSettings = (payload?: Settings) => Promise<null | Settings>
export type SetSettingsLocation = () => Promise<boolean>
export type SaveSettings = (payload: Settings) => Promise<boolean>
export type SetSettingsTemplate = (template: string[]) => Promise<boolean>
export type FetchFileCount = () => Promise<number>
export type FetchPartCount = () => Promise<number>
export type FetchFiles = () => Promise<string[]>

/**
 * rendered types, again, typically used within rendered, but may be found in preload or main
 */

export type FirstRunState = { location: boolean; template: boolean }
export type SetSettingsLocationUtil = (tl: GSAPTimeline) => void
export type AddTableHeader = (
  headers: string[],
  setTableHeaders: Dispatch<SetStateAction<string[]>>,
  newHeader: string
) => void
