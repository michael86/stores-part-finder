import { APP_DIRECTORY, SETTINGS_PATH } from '@shared/constants'
import {
  GetSettings,
  SetSettingsLocation,
  SetSettingsTemplate,
  Settings,
  SaveSettings,
  FetchFileCount,
  FetchPartCount,
  FetchFiles,
  ExtractedKeys,
  ExtractedEntry
} from '@shared/types'
import { dialog } from 'electron'
import fs, { ensureDir, readJson, writeJson } from 'fs-extra'
import path from 'path'
import { WorkBook, readFile } from 'xlsx'
import { valueIsValid, getTableMaxRow } from '../utils'

/**
 * async function returning null or user settings
 * @returns {Promise} null or settings
 */
export const getSettings: GetSettings = async () => {
  try {
    ensureDir(APP_DIRECTORY)
    const settings: Settings = await readJson(SETTINGS_PATH)
    return settings || null
  } catch (error) {
    console.log(`error attempting to getSettings: ${error}`)
    return null
  }
}

/**
 * Will ask the user to select the directory where their worksheets are stored.
 * @returns boolean based on result
 */
export const setSettingsLocation: SetSettingsLocation = async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (canceled || !filePaths || filePaths.length === 0) {
      return false // No directory selected or operation canceled
    }

    const directory = filePaths[0]
    if (!(await saveSettings({ directory }))) {
      return false // Failed to save settings
    }

    return true // Settings location set successfully
  } catch (error) {
    console.error(`Failed to setSettingsLocation: ${error}`)
    return false // Error occurred
  }
}

/**
 *
 * Save the users template to  settings.json
 *
 * @param template An array of strings, each index will be a table header within an excel sheets
 * @returns
 */
export const setSettingsTemplate: SetSettingsTemplate = async (template) => {
  console.log('template ', template)
  const saved = await saveSettings({ template })
  if (!saved) return false
  return true
}

/**
 * Triggered once upon zfirst run set up being compelete
 */
export const setSettingsFirstRunComplete = async () => {
  const saved = await saveSettings({ firstRunComplete: true })
  if (!saved) return false
  return true
}

/**
 *
 * Will save the users settings
 *
 * @param param0 diretory, string to users worksheets
 * @param param1 object containing template
 * @returns
 */

export const saveSettings: SaveSettings = async ({ directory, template, firstRunComplete }) => {
  try {
    const settings = (await getSettings()) || {}
    if (directory) settings.directory = directory
    if (template) settings.template = template
    if (firstRunComplete) settings.firstRunComplete = firstRunComplete

    // console.log('saving settings ', settings)

    await writeJson(SETTINGS_PATH, settings)
    return true
  } catch (error) {
    console.error(`Failed to saveSettings: ${error}`)
    return false
  }
}

/**
 * Will return an array of filenames from the working directory
 * @returns string[] - array of file names
 */

export const fetchFiles: FetchFiles = async () => {
  try {
    const settings: Settings = await readJson(SETTINGS_PATH)
    if (!settings?.directory) return []
    const { directory } = settings
    const files = await fs.readdir(directory)
    const validFiles = files.filter(
      (file) => !/^(?:\.|~\$)/.test(file) && /\.(xlsx|ods)$/.test(file)
    )
    return validFiles
  } catch (error) {
    console.error(`error fetchingFiles: ${error}`)
    return []
  }
}

/**
 * Will return the number of files (work orders) fount in the user defined working directory
 * @returns number - Total number of files fount within directory
 */
export const fetchFileCount: FetchFileCount = async () => {
  try {
    const files = await fetchFiles()
    return files.length
  } catch (error) {
    console.error(`Error fetching file count: ${error}`)
    return 0
  }
}

/**
 * Will iterate through all boms collecting the part numbers and returning the tally of parts
 *
 * @returns number - total number of parts fount
 */
export const fetchPartCount: FetchPartCount = async () => {
  const workOrders = await fetchFiles()
  const settings = await getSettings()
  if (!settings?.directory) {
    return 0
  }

  let count: string[] = []
  try {
    for (const order of workOrders) {
      const directory = path.join(settings.directory, order)
      const workBook = await readFile(directory)
      console.log('\x1b[32mprocessing\x1b[0m', order)

      const header = 'part number'
      const partColumns = await findHeaderColumn(workBook, header)
      count.push(...(await fetchValuesFromColumn(workBook, partColumns, header)))
    }

    return [...new Set(count)].length
  } catch (error) {
    console.log(error)
    return 0
  }
}

/**
 *
 * Will return an array containing all of the cells where the header was found
 *
 * @param directory string - location of file
 * @param header string - value of cells to be used as headers
 * @returns string[] - array of cells
 */
const findHeaderColumn = async (data: WorkBook, header: string) => {
  const columns: ExtractedKeys = []
  try {
    for (const sheet of data.SheetNames) {
      const newEntry: ExtractedEntry = { sheet, cells: [], header: '' }

      const sheetData = data.Sheets[sheet]
      const keys = Object.keys(sheetData)
      for (const key of keys) {
        const value = String(sheetData[key].v) || ''

        if (value.toLowerCase().includes(header.toLowerCase())) {
          newEntry.cells.push(key)
          newEntry.header = value
        }
      }

      columns.push(newEntry)
    }

    return columns
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * Will take in an array of sheet cells and return an array of values from the columns
 *
 * @param directory string - location of file
 * @param cells {sheet: string, cells: string[]}[] - array of objects containg the sheet and cells for table headers
 * @returns string[] - values of cells
 */

const fetchValuesFromColumn = async (
  data: WorkBook,
  payload: ExtractedKeys,
  header: string = ''
) => {
  if (!data || !payload) return []

  const values: string[] = []

  for (const { sheet, cells } of payload) {
    console.log('\x1b[31mprocessing sheet\x1b[0m', sheet)
    const sheetData = data.Sheets[sheet]

    // Create a new arrays containing unique rows and numbers
    const tableStartRows = [...new Set(cells.map((cell) => +cell.replace(/[a-zA-Z]/g, '')))]
    const tableColumns = [...new Set(cells.map((cell) => cell.replace(/\d/g, '')))]

    //Begin iterating over our tables
    for (const column of tableColumns) {
      for (const rowIndex in tableStartRows) {
        let row = tableStartRows[rowIndex]
        const nextTable = tableStartRows[+rowIndex + 1] || getTableMaxRow(sheetData) + 1

        const tableHeader = sheetData[`${column}${row}`]

        if (!tableHeader) continue

        //Due to table header being one row below the table details we want to iterate up to the row before the header
        while (row < nextTable - 1) {
          const index = row + 1
          const cellData = sheetData[`${column}${index}`]

          if (cellData) {
            const data = cellData.v.toLowerCase()
            //Fount end of sheet
            if (data === 'key' || !valueIsValid(data)) {
              row++
              continue
            }

            values.push(cellData.v.toLowerCase())
          }
          row++
        }
      }
    }
  }

  return [...new Set(values)]
}
