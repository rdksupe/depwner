const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
const chokidar = require('chokidar');

const settingsPath = path.join(__dirname, './data/settings.json');
const logsPath = path.join(__dirname, './data/logs.json');
const quarantine = path.join(__dirname, './data/quarantine.json');

let win;

let watcher = null;

///////////// TODO Begin //////////////////
//
// 0) hashChecking and yaraChecking
// 1) setScanStatus
// 2) startManualScan
//
//////////// TODO End ////////////////////

// const exePath = app.getPath('exe');
// var basePath = exePath.slice(0, exePath.lastIndexOf("\\"));
// basePath = "./backend";

let status = {
    status: 'idle', // idle if no manual scan / scan if manual scan
    type: 'full', // 'full' Full Scan / 'custom' Custom Scan
    progress: '0' // The number of files scanned
}
// const setScanStatus = () => {
//     // Should set the status based on what's going on
//     // See status definition
// }
// const getScanStatus = () => {
//     return status
// }


let settings = {
    "yara": true,
    "schedule": {
        "active": true,
        "freq": "weekly",
        "days": {
            "sun": true,
            "mon": false,
            "tue": false,
            "wed": false,
            "thu": false,
            "fri": false,
            "sat": false
        },
        "time": "13:00"
    },
    "locations": []
}
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


// NEW: Global manual scan status state.
let manualScanStatus = {
  status: 'idle', // 'idle' or 'scanning'
  type: null,     // 'full' or 'custom'
  progress: 0,    // Could be percent or count
  output: null    // Raw scanner output
};

// Updated getScanStatus to return the raw scanner output.
const getScanStatus = () => {
    return manualScanStatus.output;
};

// New setScanStatus to update state based on scan type.
const setScanStatus = (scanType, progress, output = null) => {
    manualScanStatus.status = progress < 100 ? 'scanning' : 'idle';
    manualScanStatus.type = scanType;
    manualScanStatus.progress = progress;
    manualScanStatus.output = output;
};

// Implement startManualScan to scan a file or folder.
const startManualScan = async (pathToScan, type) => {
    // Update status to scanning with 0 progress.
    console.log("Starting manual scan:", pathToScan, type);
    setScanStatus(type, 0);
    let options = { dbPath: "./scanner/full.csv", yaraPath: "./scanner/output.yarc" };
    try {
        if (fs.statSync(pathToScan).isDirectory()) {
            options.folderPath = pathToScan;
        } else {
            options.filePath = pathToScan;
        }
        // Dynamically import scanner.mjs for scanInput.
        const { scanInput } = await import('./scanner/scanner.mjs');
        const result = await scanInput(options);
        // Update state with raw output
        setScanStatus(type, 100, result);
        if (win) win.webContents.send("scanStatus", manualScanStatus);
    } catch (err) {
        console.error("Error during manual scan:", err);
        setScanStatus(type, 100, { error: err.message });
        if (win) win.webContents.send("scanStatus", manualScanStatus);
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

function startWatcher() {
    if (!settings || !Array.isArray(settings.locations) || settings.locations.length === 0) {
        console.warn("No directories configured for watching.");
        return;
    }

    console.log("Chokidar is watching:", settings.locations);

    if (watcher) {
        console.log("Stopping previous watcher...");
        watcher.close().then(() => {
            watcher = chokidar.watch(settings.locations, {
                persistent: true,
                ignoreInitial: true,
                ignorePermissionErrors: true,
            });

            watcher.on("add", (filePath) => {
                console.log(`File added: ${filePath}`);
                if (win) win.webContents.send("fileEvent", { event: "add", filePath });
            });

            watcher.on("change", (filePath) => {
                console.log(`File changed: ${filePath}`);
                if (win) win.webContents.send("fileEvent", { event: "change", filePath });
            });

            console.log("Watcher restarted!");
        });
    } else {
        watcher = chokidar.watch(settings.locations, {
            persistent: true,
            ignoreInitial: true,
            ignorePermissionErrors: true,
        });

        watcher.on("add", (filePath) => {
            console.log(`File added: ${filePath}`);
            if (win) win.webContents.send("fileEvent", { event: "add", filePath });
        });

        watcher.on("change", (filePath) => {
            console.log(`File changed: ${filePath}`);
            if (win) win.webContents.send("fileEvent", { event: "change", filePath });
        });

        console.log("Watcher started!");
    }
}


const getStats = async () => {
    let statsObject = fs.readFileSync(logsPath, 'utf-8')
    console.log("Logs Fetched")
    return statsObject

}


const openFileDialog = async () => {
    const { cancelled, filePaths } = await dialog.showOpenDialog(win, { title: "Choose file to scan", properties: ["openFile"] })
    if (cancelled) {
        return "User Cancelled"
    } else {
        return filePaths[0]
    }
}

const openFolderDialog = async () => {
    const { cancelled, filePaths } = await dialog.showOpenDialog(win, { title: "Choose folder to scan", properties: ["openDirectory"] })
    if (cancelled) {
        return "User Cancelled"
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

app.whenReady().then(() => {
    ipcMain.handle("getSettings", getSettings)
    ipcMain.handle("getStats", getStats)
    ipcMain.handle("getThreats", getThreats)
    ipcMain.handle("getScanStatus", getScanStatus)
    ipcMain.on("setSettings", setSettings)
    ipcMain.on("startManualScan", (event, pathToScan, type) => {
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
        console.log("Settings Loaded:", settings);
    } catch (err) {
        console.error("Error loading settings:", err);
    }
    createWindow()

    console.log("Main window loaded, starting watcher...");
    startWatcher();

    // Pre-load CSV database.
    preloadCsv();

    // (async () => {
    //     settings = await getSettings();
    // })();
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
