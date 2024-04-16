import {
  FetchFileCount,
  FetchPartCount,
  GetDir,
  GetSettings,
  SetSettingsLocation,
  SetSettingsTemplate
} from '@shared/types'

declare global {
  interface Window {
    // electron: ElectronAPI
    context: {
      locale: string
      getSettings: GetSettings
      setSettingsLocation: SetSettingsLocation
      setSettingsTemplate: SetSettingsTemplate
      setSettingsFirstRunComplete: () => void
      fetchFileCount: FetchFileCount
      fetchPartCount: FetchPartCount
    }
  }
}
