"use strict";
const electron = require("electron");
const fs = require("fs-extra");
const path = require("path");
const xlsx = require("xlsx");
const utils = require("@electron-toolkit/utils");
const APP_DIRECTORY = electron.app.getPath("userData");
const SETTINGS_PATH = `${APP_DIRECTORY}/settings.json`;
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
    const validFiles = files.filter((file) => !/^\./.test(file) && /\.(xlsx|ods)$/.test(file));
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
  for (const order of workOrders) {
    const directory = path.join(settings.directory, order);
    const workBook = await xlsx.readFile(directory);
    const partColumns = await findHeaderColumn(workBook, "part number");
    await fetchValuesFromColumn(workBook, partColumns);
  }
  return 100;
};
const findHeaderColumn = async (data, header) => {
  const columns = [];
  for (const sheet of data.SheetNames) {
    const newEntry = { sheet, cells: [] };
    const sheetData = data.Sheets[sheet];
    const keys = Object.keys(sheetData);
    for (const key of keys) {
      const value = String(sheetData[key].v) || "";
      if (value.toLowerCase() === header.toLowerCase())
        newEntry.cells.push(key);
    }
    columns.push(newEntry);
  }
  return columns;
};
const fetchValuesFromColumn = async (data, cells) => {
  if (!data || !cells)
    return [];
  for (const entry of cells) {
    const sheetData = data.Sheets[entry.sheet];
    for (const cell of entry.cells) {
      const column = cell.replace(/\d/g, "").toLowerCase();
      const row = +cell.replace(/[a-zA-Z]/g, "");
      for (const _cell of entry.cells) {
        const _row = +_cell.replace(/[a-zA-Z]/g, "");
        if (_cell.includes(column) && _cell !== `${column}${row}` && row < _row) {
          break;
        }
      }
      let highestRow = 0;
      for (const sheetKey of Object.keys(sheetData)) {
        const sheetKeyCol = cell.replace(/\d/g, "");
        const sheetKeyRow = +cell.replace(/[a-zA-Z]/g, "");
        if (sheetKeyCol.toLowerCase() === column) {
          highestRow = highestRow < sheetKeyRow ? sheetKeyRow : highestRow;
        }
      }
      console.log(entry.sheet);
      console.log("highestRow ", highestRow);
    }
  }
  return [];
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
