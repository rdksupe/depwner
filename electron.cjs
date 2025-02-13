const { app, BrowserWindow } = require('electron')
const path = require('node:path')

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

app.whenReady().then(() => {
    createWindow()

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
