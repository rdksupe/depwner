const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
let win;

// const exePath = app.getPath('exe');
// var basePath = exePath.slice(0, exePath.lastIndexOf("\\"));
// basePath = "./backend";
//
// console.log(basePath);

function createWindow() {
    if (process.platform == 'windows') {
        let backend = path.join(process.cwd(), './engine.exe');
        let execfile = require('child_process').execFile;
        execfile(
            backend,
            {
                windowsHide: true,
            },
            (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                }
                if (stdout) {
                    console.log(stdout);
                }
                if (stderr) {
                    console.log(stderr);
                }
            }
        )
    }
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

    win.loadFile('./build/index.html')
}

const settingsPath = path.join(__dirname, './data/settings.json');
const logsPath = path.join(__dirname, './data/logs.json');
const quarantine = path.join(__dirname, './data/quarantine/')
const status = "idle"
let settings;

const getSettings = async () => {
    let settingsObject = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    console.log("Settings Fetched")
    return settingsObject
}
const getThreats = () => {

}
const getStats = () => {

}

const setSettings = (settings) => {

}

const getScanStatus = () => {
    return status
}

app.whenReady().then(() => {
    ipcMain.handle("getSettings", getSettings)
    ipcMain.handle("getStats", getStats)
    ipcMain.handle("getThreats", getThreats)
    ipcMain.handle("getScanStatus", getScanStatus)
    createWindow()

    async () => {
        settings = await getSettings();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform == 'windows') {
        const { exec } = require('child_process');
        exec('taskkill /f /t /im engine.exe', (err, stdout, stderr) => {
            if (err) {
                console.log(err)
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });
    }
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
