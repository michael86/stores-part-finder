"use strict";
const electron = require("electron");
const fs = require("fs-extra");
const path = require("path");
const XLSX = require("xlsx");
const utils = require("@electron-toolkit/utils");
const APP_DIRECTORY = electron.app.getPath("userData");
const SETTINGS_PATH = `${APP_DIRECTORY}/settings.json`;
const valueIsValid = (value) => {
  const illegalChars = [" ", "-", ":"];
  const sani = value.trim().toLowerCase();
  return !illegalChars.some((char) => sani.includes(char));
};
const getTableMaxRow = (sheet) => {
  const ref = sheet["!ref"];
  if (!ref)
    return 0;
  const maxRow = XLSX.utils.decode_range(ref).e.r + 1;
  return maxRow;
};
const getSettings = async () => {
  try {
    fs.ensureDir(APP_DIRECTORY);
    const settings = await fs.readJson(SETTINGS_PATH);
    return settings || null;
  } catch (error) {
    console.log(`error attempting to getSettings: ${error}`);
    return null;
  }
};
const setSettingsLocation = async () => {
  try {
    const { filePaths, canceled } = await electron.dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return false;
    }
    const directory = filePaths[0];
    if (!await saveSettings({ directory })) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Failed to setSettingsLocation: ${error}`);
    return false;
  }
};
const setSettingsTemplate = async (template) => {
  console.log("template ", template);
  const saved = await saveSettings({ template });
  if (!saved)
    return false;
  return true;
};
const setSettingsFirstRunComplete = async () => {
  const saved = await saveSettings({ firstRunComplete: true });
  if (!saved)
    return false;
  return true;
};
const saveSettings = async ({ directory, template, firstRunComplete }) => {
  try {
    const settings = await getSettings() || {};
    if (directory)
      settings.directory = directory;
    if (template)
      settings.template = template;
    if (firstRunComplete)
      settings.firstRunComplete = firstRunComplete;
    await fs.writeJson(SETTINGS_PATH, settings);
    return true;
  } catch (error) {
    console.error(`Failed to saveSettings: ${error}`);
    return false;
  }
};
const fetchFiles = async () => {
  try {
    const settings = await fs.readJson(SETTINGS_PATH);
    if (!settings?.directory)
      return [];
    const { directory } = settings;
    const files = await fs.readdir(directory);
    const validFiles = files.filter(
      (file) => !/^(?:\.|~\$)/.test(file) && /\.(xlsx|ods)$/.test(file)
    );
    return validFiles;
  } catch (error) {
    console.error(`error fetchingFiles: ${error}`);
    return [];
  }
};
const fetchFileCount = async () => {
  try {
    const files = await fetchFiles();
    return files.length;
  } catch (error) {
    console.error(`Error fetching file count: ${error}`);
    return 0;
  }
};
const fetchPartCount = async () => {
  const workOrders = await fetchFiles();
  const settings = await getSettings();
  if (!settings?.directory) {
    return 0;
  }
  let count = [];
  try {
    for (const order of workOrders) {
      const directory = path.join(settings.directory, order);
      const workBook = await XLSX.readFile(directory);
      console.log("\x1B[32mprocessing\x1B[0m", order);
      const header = "part number";
      const partColumns = await findHeaderColumn(workBook, header);
      count.push(...await fetchValuesFromColumn(workBook, partColumns, header));
    }
    return [...new Set(count)].length;
  } catch (error) {
    console.log(error);
    return 0;
  }
};
const findHeaderColumn = async (data, header) => {
  const columns = [];
  try {
    for (const sheet of data.SheetNames) {
      const newEntry = { sheet, cells: [], header: "" };
      const sheetData = data.Sheets[sheet];
      const keys = Object.keys(sheetData);
      for (const key of keys) {
        const value = String(sheetData[key].v) || "";
        if (value.toLowerCase().includes(header.toLowerCase())) {
          newEntry.cells.push(key);
          newEntry.header = value;
        }
      }
      columns.push(newEntry);
    }
    return columns;
  } catch (error) {
    console.error(error);
    return [];
  }
};
const fetchValuesFromColumn = async (data, payload, header = "") => {
  if (!data || !payload)
    return [];
  const values = [];
  for (const { sheet, cells } of payload) {
    console.log("\x1B[31mprocessing sheet\x1B[0m", sheet);
    const sheetData = data.Sheets[sheet];
    const tableStartRows = [...new Set(cells.map((cell) => +cell.replace(/[a-zA-Z]/g, "")))];
    const tableColumns = [...new Set(cells.map((cell) => cell.replace(/\d/g, "")))];
    for (const column of tableColumns) {
      for (const rowIndex in tableStartRows) {
        let row = tableStartRows[rowIndex];
        const nextTable = tableStartRows[+rowIndex + 1] || getTableMaxRow(sheetData) + 1;
        const tableHeader = sheetData[`${column}${row}`];
        if (!tableHeader)
          continue;
        while (row < nextTable - 1) {
          const index = row + 1;
          const cellData = sheetData[`${column}${index}`];
          if (cellData) {
            const data2 = cellData.v.toLowerCase();
            if (data2 === "key" || !valueIsValid(data2)) {
              row++;
              continue;
            }
            values.push(cellData.v.toLowerCase());
          }
          row++;
        }
      }
    }
  }
  return [...new Set(values)];
};
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    center: true,
    title: "Creekview BOM Comparison tool",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.handle("getSettings", () => getSettings());
  electron.ipcMain.handle("setSettingsLocation", () => setSettingsLocation());
  electron.ipcMain.handle("setSettingsTemplate", (_, headers) => setSettingsTemplate(headers));
  electron.ipcMain.handle("setSettingsFirstRunComplete", () => setSettingsFirstRunComplete());
  electron.ipcMain.handle("fetchFileCount", () => fetchFileCount());
  electron.ipcMain.handle("fetchPartCount", () => fetchPartCount());
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
