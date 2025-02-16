const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
const chokidar = require('chokidar');

let win;
let watcher = null;
// const exePath = app.getPath('exe');
// var basePath = exePath.slice(0, exePath.lastIndexOf("\\"));
// basePath = "./backend";
//
// console.log(basePath);
const settingsPath = path.join(__dirname, './data/settings.json');

function createWindow() {
    // if (process.platform == 'windows') {
    //     let backend = path.join(process.cwd(), './engine.exe');
    //     let execfile = require('child_process').execFile;
    //     execfile(
    //         backend,
    //         {
    //             windowsHide: true,
    //         },
    //         (err, stdout, stderr) => {
    //             if (err) {
    //                 console.log(err);
    //             }
    //             if (stdout) {
    //                 console.log(stdout);
    //             }
    //             if (stderr) {
    //                 console.log(stderr);
    //             }
    //         }
    //     )
    // }
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
            // nodeIntegration: true,
            // contextIsolation: false
        }
    })

    // win.loadFile('./build/index.html'); 
    
    // startWatcher();
    win.loadFile('./build/index.html').then(() => {
        console.log("Main window loaded, starting watcher...");
        startWatcher(); 
    });
}

function loaddirs() {
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        return settings.locations || [];
    } catch (error) {
        console.error("Error loading settings:", error);
        return [];
    }
}

function startWatcher() {
    const dirs = loaddirs();

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

const logsPath = path.join(__dirname, './data/logs.json');
const quarantine = path.join(__dirname, './data/quarantine/')
const status = "idle"

const getThreats = () => {

}
const getStats = () => {

}

const setSettings = (settings) => {

}

const getScanStatus = () => {

}

app.whenReady().then(() => {
    ipcMain.handle("getStats", getStats)
    ipcMain.handle("getThreats", getThreats)
    ipcMain.handle("getScanStatus", getScanStatus)
    ipcMain.handle("getSettings", async () => JSON.parse(fs.readFileSync(settingsPath, 'utf-8')));
    ipcMain.handle("reloadWatcher", () => {
        console.log("Reloading watcher...");
        startWatcher();
    });
    createWindow()
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
