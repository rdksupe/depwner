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
const setScanStatus = () => {
    // Should set the status based on what's going on
    // See status definition
}
const getScanStatus = () => {
    return status
}


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
    "locations": [""]
}
const setSettings = async (_, setting) => {
    console.log("Settings Written")
    fs.writeFileSync(settingsPath, setting, err => {
        if (err) {
            console.error(err);
        } else {
            settings = setting
        }
    })
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


const startManualScan = (pathToScan, type) => {
    // pathToScan- file or directory
    // type- Full or Custom (for the logs)
    // Update state after each filescan
    // Take into consideration if YARA is enabled
}


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
    const dirs = settings.locations;

    if (dirs.length === 0) {
        console.warn("No dirs to watch.");
        return;
    } else {
        console.log("Chokidar is watching:", dirs);
    }

    if (watcher) {
        console.log("Stopping previous watcher...");
        watcher.close();
    }

    watcher = chokidar.watch(dirs, {
        persistent: true,
        ignoreInitial: true,
        ignorePermissionErrors: true
    });

    watcher
        .on('add', filePath => {
            console.log(`File added: ${filePath}`);
            if (win) win.webContents.send('fileEvent', { event: 'add', filePath });
        })
        .on('change', filePath => {
            console.log(`File changed: ${filePath}`);
            if (win) win.webContents.send('fileEvent', { event: 'change', filePath });
        });

    console.log("Watcher started!");
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

app.whenReady().then(() => {
    ipcMain.handle("getSettings", getSettings)
    ipcMain.handle("getStats", getStats)
    ipcMain.handle("getThreats", getThreats)
    ipcMain.handle("getScanStatus", getScanStatus)
    ipcMain.on("setSettings", setSettings)
    ipcMain.on("startManualScan", startManualScan)
    ipcMain.handle("selectFile", openFileDialog)
    ipcMain.handle("selectFolder", openFolderDialog)
    ipcMain.handle("reloadWatcher", () => {
        console.log("Reloading watcher...");
        startWatcher();
    });
    createWindow()

    console.log("Main window loaded, starting watcher...");
    startWatcher();

    (async () => {
        settings = await getSettings();
    })();
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
