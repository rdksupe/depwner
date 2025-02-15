const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
let win;

let status = "idle"
let setting;

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
        // frame: false,
        autoHideMenuBar: true,
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
const quarantine = path.join(__dirname, './data/quarantine.json');

const getSettings = async () => {
    let settingsObject = fs.readFileSync(settingsPath, 'utf-8')
    console.log("Settings Fetched")
    return settingsObject
}

const getThreats = async () => {
    // let threatsObject = JSON.parse(fs.readFileSync(quarantine, 'utf-8'))
    let threatsObject = fs.readFileSync(quarantine, 'utf-8')
    console.log("Threats Fetched")
    return threatsObject
}

const getStats = async () => {
    let statsObject = fs.readFileSync(logsPath, 'utf-8')
    console.log("Logs Fetched")
    return statsObject

}

const setSettings = async (_, settings) => {
    console.log("Settings Written")
    // let settingsJson = JSON.stringify(settings)
    fs.writeFileSync(settingsPath, settings, err => {
        if (err) {
            console.error(err);
        } else {
            setting = settings
        }
    })
}

const getScanStatus = () => {
    return status
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
    ipcMain.handle("selectFile", openFileDialog)
    ipcMain.handle("selectFolder", openFolderDialog)

    createWindow()

        (async () => {
            setting = await getSettings();
        })();

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
