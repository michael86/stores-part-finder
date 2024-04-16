import { app } from 'electron'

export const FILE_ENCODING = 'utf8'
export const APP_DIRECTORY = app.getPath('userData')
export const SETTINGS_PATH = `${APP_DIRECTORY}/settings.json`
