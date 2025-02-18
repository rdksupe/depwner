const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
const chokidar = require('chokidar');

const settingsPath = path.join(__dirname, './data/settings.json');
const logsPath = path.join(__dirname, './data/logs.json');
const quarantine = path.join(__dirname, './data/quarantine.json');

let win;

let watcher = null;

const startManualScan = async (pathToScan, type) => {
    console.log("Starting manual scan:", pathToScan, type);

    global.scanStatus = {
        status: 'scan',
        type: type,
        progress: 0,
        threatsFound: 0,
        currentFile: '',
    }

    let options;
    if (settings.yara) {
        options = { whitelist: "./scanner/whitelist.txt", dbPath: "./scanner/full.csv", yaraPath: "./scanner/output.yarc" };
    } else {
        options = { whitelist: "./scanner/overWhite.txt", dbPath: "./scanner/overFit.csv", yaraPath: "" };
    }

    try {
        if (fs.statSync(pathToScan).isDirectory()) {
            options.folderPath = pathToScan;
        } else {
            options.filePath = pathToScan;
        }
        // Dynamically import scanner.mjs for scanInput.
        const { scanInput } = await import('./scanner/scanner.mjs');
        const result = await scanInput(options);
        global.scanStatus = 'completed'

    } catch (err) {
        console.error("Error during manual scan:", err);
        global.scanStatus.status = 'idle';
        if (win) win.webContents.send("scanStatus", manualScanStatus);
    }
};

function startWatcher() {
    if (!settings || !Array.isArray(settings.locations) || settings.locations.length === 0) {
        console.warn("No directories configured for watching.");
        return;
    }

    console.log("Chokidar is watching:", settings.locations);

    // Updated event handlers to trigger manual scan.
    const attachWatcherEvents = (watcherInstance) => {
        watcherInstance.on("add", (filePath) => {
            console.log(`File added: ${filePath}`);
            if (win) win.webContents.send("fileEvent", { event: "add", filePath });
            // Automatically scan the new file.
            startManualScan(filePath, "custom");
        });
        watcherInstance.on("change", (filePath) => {
            console.log(`File changed: ${filePath}`);
            if (win) win.webContents.send("fileEvent", { event: "change", filePath });
            // Automatically scan the changed file.
            startManualScan(filePath, "custom");
        });
    };

    if (watcher) {
        console.log("Stopping previous watcher...");
        watcher.close().then(() => {
            watcher = chokidar.watch(settings.locations, {
                persistent: true,
                ignoreInitial: true,
                ignorePermissionErrors: true,
            });
            attachWatcherEvents(watcher);
            settings.locations.forEach((location) => {
                startManualScan(location, "autoScan")
            })
            console.log("Watcher restarted!");
        });
    } else {
        watcher = chokidar.watch(settings.locations, {
            persistent: true,
            ignoreInitial: true,
            ignorePermissionErrors: true,
        });
        attachWatcherEvents(watcher);
        settings.locations.forEach((location) => {
            startManualScan(location, "autoScan")
        })
        console.log("Watcher started!");
    }
}


var settings = require("./data/settings.json")

const setSettings = async (_, setting) => {
    try {
        console.log("Settings Written");
        fs.writeFileSync(settingsPath, setting);
        settings = JSON.parse(setting);
        startWatcher();
    } catch (err) {
        console.error("Error writing settings:", err);
    }
}
const getSettings = async () => {
    let settingsObject = fs.readFileSync(settingsPath, 'utf-8')
    console.log("Settings Fetched")
    return settingsObject
}


const getThreats = async () => {
    let threatsObject = fs.readFileSync(quarantine, 'utf-8')
    console.log("Threats Fetched")
    return threatsObject
}


let scanStatus = {
    status: 'idle', // idle if no manual scan / scan if manual scan
    type: 'full', // 'full' Full Scan / 'custom' Custom Scan
    progress: 0, // The number of files scanned
    threatsFound: [],
    filesToScan: 100,
    currentFile: '',
}
async function getStatus() {
    return JSON.stringify(scanStatus)
}

const getStats = async () => {
    let statsObject = fs.readFileSync(logsPath, 'utf-8')
    console.log("Logs Fetched")
    return statsObject

}


const openFileDialog = async () => {
    const { cancelled, filePaths } = await dialog.showOpenDialog(win, { title: "Choose file to scan", properties: ["openFile"] })
    if (cancelled || !filePaths) {
        return "user cancelled"
    } else {
        return filePaths[0]
    }
}

const openFolderDialog = async () => {
    const { cancelled, filePaths } = await dialog.showOpenDialog(win, { title: "Choose folder to scan", properties: ["openDirectory"] })
    if (cancelled || !filePaths) {
        return "user cancelled"
    } else {
        return filePaths[0]
    }
}

// NEW: Pre-load CSV in app.whenReady() for faster future scans.
const preloadCsv = async () => {
    try {
        const { loadCsvToBloom } = await import('./scanner/scanner.mjs');
        // Use default CSV path as specified in run_scan.js ("./full.csv")
        const csvData = await loadCsvToBloom("./scanner/full.csv");
        global.preloadedCsvData = csvData;
        console.log("CSV pre-loaded for faster future scans.");
    } catch (err) {
        console.error("Error pre-loading CSV:", err);
    }
};


function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('./build/index.html');
}

app.whenReady().then(() => {
    ipcMain.handle("getSettings", getSettings)
    ipcMain.handle("getStats", getStats)
    ipcMain.handle("getThreats", getThreats)
    ipcMain.handle("getScanStatus", getStatus)
    ipcMain.on("setSettings", setSettings)
    ipcMain.on("startManualScan", (_, pathToScan, type) => {
        startManualScan(pathToScan, type);
    });
    ipcMain.handle("selectFile", openFileDialog)
    ipcMain.handle("selectFolder", openFolderDialog)
    ipcMain.handle("reloadWatcher", () => {
        console.log("Reloading watcher...");
        startWatcher();
    });
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        global.settings = settings;
        console.log("Settings Loaded:", settings);
    } catch (err) {
        console.error("Error loading settings:", err);
    }

    createWindow()

    console.log("Main window loaded, starting watcher...");
    startWatcher();

    // Pre-load CSV database.
    preloadCsv();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (watcher) watcher.close();
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
