import XLSX, { Sheet, WorkBook, WorkSheet } from 'xlsx'

/**
 * will clean a string up and check for whitespace to determine if a string is valid or not
 * @param value string - string to checl
 * @returns boolean
 */
export const valueIsValid = (value: string) => {
  const illegalChars = [' ', '-', ':']
  const sani = value.trim().toLowerCase()
  return !illegalChars.some((char) => sani.includes(char))
}

/**
 * returns the highest row count in the sheet
 * @param sheet - sheet
 * @returns number
 */
export const getTableMaxRow = (sheet: WorkSheet) => {
  const ref = sheet['!ref']
  if (!ref) return 0
  const maxRow = XLSX.utils.decode_range(ref).e.r + 1

  return maxRow
}
