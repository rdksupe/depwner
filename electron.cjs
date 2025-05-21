const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, Notification } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
const chokidar = require('chokidar');
const { pathToFileURL } = require('url');

const homedir = require('os').homedir();
const dataDir = path.join(homedir, './dePWNer')
const scannerDir = path.join(dataDir, './scanner/')

if (!fs.existsSync(dataDir)) {
    console.log('First Run Detected')
    fs.cpSync(path.join(__dirname, './data/'), dataDir, { recursive: true }, (err) => {
        if (err) {
            console.error(err)
        } else {
            console.log("copied data files")
        }
    })
    fs.cpSync(path.join(__dirname, './scanner/'), scannerDir, { recursive: true }, (err) => {
        if (err) {
            console.error(err)
        } else {
            console.log("copied scanner files")
        }
    })

    // Create static directory in user's dataDir and copy update_database.py
    try {
        const staticDirUserPath = path.join(dataDir, 'static');
        if (!fs.existsSync(staticDirUserPath)) {
            fs.mkdirSync(staticDirUserPath, { recursive: true });
            console.log(`Created directory: ${staticDirUserPath}`);
        }

        const sourceScriptPath = path.join(__dirname, 'static/update_database.py');
        const destScriptPath = path.join(staticDirUserPath, 'update_database.py');
        
        if (!fs.existsSync(sourceScriptPath)) {
            console.error(`Error: Source script not found at ${sourceScriptPath}. Please ensure the file exists in the application's static folder.`);
        } else {
            fs.copyFileSync(sourceScriptPath, destScriptPath);
            console.log(`Copied update_database.py to ${destScriptPath}`);
        }
    } catch (error) {
        console.error('Error copying update_database.py during first run:', error);
    }
}

const settingsPath = path.join(dataDir, './settings.json');
const logsPath = path.join(dataDir, './logs.json');
const quarantine = path.join(dataDir, './quarantine.json');
const cron = require('node-cron');

let win;

let watcher = null;

function scheduleScanning() {
    if (!settings.schedule || !settings.schedule.active) {
        console.log("Scheduling is disabled.");
        return;
    }

    console.log("Setting up scanning schedule...");

    cron.getTasks().forEach(task => task.stop());

    const { freq, time, days } = settings.schedule;

    function getCurrentTimeIn24HFormat() {
        const now = new Date();
        const userTime = now.toLocaleTimeString('en-GB', { hour12: false }); // Get 24H format
        return userTime.slice(0, 5); // Extract HH:MM
    }

    if (freq === "hourly") {
        cron.schedule("0 * * * *", () => {
            console.log("Running hourly scan...");
            if (settings.locations.length > 0) {
                settings.locations.forEach(location => startManualScan(location, "custom"));
            } else {
                console.warn("No locations set for scanning.");
            }
        });
    } else if (freq === "daily") {
        const [hour, minute] = time.split(":").map(Number);
        cron.schedule(`${minute} ${hour} * * *`, () => {
            const currentTime = getCurrentTimeIn24HFormat();
            console.log(`Running daily scan at ${currentTime}...`);
            if (settings.locations.length > 0) {
                settings.locations.forEach(location => startManualScan(location, "custom"));
            } else {
                console.warn("No locations set for scanning.");
            }
        });
    } else if (freq === "weekly") {
        const [hour, minute] = time.split(":").map(Number);
        const dayMap = {
            sun: 0,
            mon: 1,
            tue: 2,
            wed: 3,
            thu: 4,
            fri: 5,
            sat: 6
        };

        Object.entries(days).forEach(([day, active]) => {
            if (active) {
                cron.schedule(`${minute} ${hour} * * ${dayMap[day]}`, () => {
                    const currentTime = getCurrentTimeIn24HFormat();
                    console.log(`Running weekly scan on ${day} at ${currentTime}...`);
                    if (settings.locations.length > 0) {
                        settings.locations.forEach(location => startManualScan(location, "custom"));
                    } else {
                        console.warn("No locations set for scanning.");
                    }
                });
            }
        });
    }
}

const startManualScan = async (pathToScan, type) => {
    if (!pathToScan) {
        console.error("Error: pathToScan is undefined.");
        return;
    }
    console.log("Starting manual scan:", pathToScan, type);

    global.scanStatus = {
        status: 'scan',
        type: type,
        progress: 0,
        threatsFound: [],
        currentFile: '',
    }

    let options;
    if (settings.yara) {
        options = {
            dbPath: path.join(dataDir, "./scanner/malware_hashes.db"),
            yaraPath: path.join(dataDir, "./scanner/output.yarc"),
            scannerDir: scannerDir,
            dataDir: dataDir
        };
    } else {
        options = {
            dbPath: path.join(dataDir, "simple_malware_hashes.db"),
            yaraPath: "",
            scannerDir: scannerDir,
            dataDir: dataDir
        };
    }

    options.type = type

    try {
        if (fs.statSync(pathToScan).isDirectory()) {
            options.folderPath = pathToScan;
        } else {
            options.filePath = pathToScan;
        }
        console.log(options);
        // Replace dynamic import with file URL conversion:
        const scannerModuleUrl = pathToFileURL(path.join(__dirname, './scanner/scanner.cjs')).href;
        const { scanInput } = await import(scannerModuleUrl);
        const result = await scanInput(options);
        global.scanStatus = 'completed';
    } catch (err) {
        console.error("Error during manual scan:", err);
        global.scanStatus.status = 'idle';
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


var settings = require(path.join(dataDir, './settings.json'));

// Ensure settings.lastUpdated exists
if (settings.lastUpdated === undefined) {
    settings.lastUpdated = "Never";
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log("Initialized and saved settings.lastUpdated");
    } catch (err) {
        console.error("Error saving initial settings.lastUpdated:", err);
    }
}


const setSettings = async (_, setting) => {
    try {
        console.log("Settings Written");
        fs.writeFileSync(settingsPath, setting);
        settings = JSON.parse(setting);
        startWatcher();
        scheduleScanning()
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
// const preloadCsv = async () => {
//     try {
//         const { loadCsvToBloom } = await import('./scanner/scanner.cjs');
//         // Initialize database and import CSV if needed
//         const dbPath = path.join(__dirname, 'scanner', 'malware_hashes.db');
//         const csvPath = path.join(__dirname, 'scanner', 'full.csv');
//
//         // Try to load DB first, if it fails or is empty, it will import from CSV
//         const csvData = await loadCsvToBloom(fs.existsSync(dbPath) ? dbPath : csvPath);
//         global.preloadedCsvData = csvData;
//         console.log("Database initialized successfully");
//     } catch (err) {
//         console.error("Error initializing database:", err);
//     }
// };

const removeThreat = async (_, threat) => {
    // Use threat.oldPath

}

const restoreThreat = async (_, threat) => {
    // Use threat.oldPath and threat.hash
}

const icon = nativeImage.createFromPath(path.join(dataDir, './Logo_smol.png'))
function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "dePWNer",
        autoHideMenuBar: true,
        icon: icon,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('./build/index.html');
}

let tray = null
let isQuiting = false
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
    ipcMain.handle("removeThreat", removeThreat);
    ipcMain.handle("restoreThreat", restoreThreat);

    // Updated IPC handler for updating definitions
    ipcMain.handle("updateDefinitions", async () => {
        let tempFeedPath = '';
        try {
            console.log("Fetching latest definitions from Malware Bazaar...");
            const response = await fetch('https://bazaar.abuse.ch/export/txt/md5/recent/');
            if (!response.ok) {
                throw new Error(`Failed to fetch definitions: ${response.statusText}`);
            }
            const feedData = await response.text();
            console.log("Fetched definitions (first 500 chars):", feedData.substring(0, 500));

            const pythonScriptPath = path.join(dataDir, 'static/update_database.py');
            const dbPath = settings.yara ? path.join(scannerDir, 'malware_hashes.db') : path.join(dataDir, 'simple_malware_hashes.db');
            
            tempFeedPath = path.join(require('os').tmpdir(), `depwner_feed_${Date.now()}.txt`);
            fs.writeFileSync(tempFeedPath, feedData);
            console.log(`Feed data written to temporary file: ${tempFeedPath}`);
            console.log(`Python script path: ${pythonScriptPath}`);
            console.log(`Database path: ${dbPath}`);

            // Check if Python script exists
            if (!fs.existsSync(pythonScriptPath)) {
                throw new Error(`Update script not found at ${pythonScriptPath}`);
            }
            // Check if DB exists
            if (!fs.existsSync(dbPath)) {
                throw new Error(`Database not found at ${dbPath}. Please ensure it's created, possibly by running a scan first or during app setup.`);
            }


            const runPythonScript = (pythonCmd) => {
                return new Promise((resolve, reject) => {
                    const { spawn } = require('child_process');
                    const scriptProcess = spawn(pythonCmd, [pythonScriptPath, dbPath, tempFeedPath]);
                    
                    let stdout = '';
                    let stderr = '';

                    scriptProcess.stdout.on('data', (data) => {
                        stdout += data.toString();
                    });

                    scriptProcess.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });

                    scriptProcess.on('close', (code) => {
                        console.log(`${pythonCmd} process exited with code ${code}`);
                        if (code === 0 && !stderr) { // Checking for no stderr as well
                            resolve({ stdout, stderr, pythonCmdUsed: pythonCmd });
                        } else {
                            reject({ code, stdout, stderr, pythonCmdUsed: pythonCmd });
                        }
                    });

                    scriptProcess.on('error', (err) => {
                        console.error(`Failed to start ${pythonCmd} process:`, err);
                        reject({ error: err, pythonCmdUsed: pythonCmd });
                    });
                });
            };

            let scriptResult;
            try {
                console.log("Attempting to run update script with python3...");
                scriptResult = await runPythonScript('python3');
            } catch (errorInfoP3) {
                if (errorInfoP3.error && errorInfoP3.error.code === 'ENOENT') { // 'ENOENT' typically means command not found
                    console.warn("python3 command not found or failed, trying with python...");
                    try {
                        scriptResult = await runPythonScript('python');
                    } catch (errorInfoPy) {
                         console.error("Error executing Python script with python:", errorInfoPy.stderr || errorInfoPy.stdout || errorInfoPy.error);
                         throw new Error(`Error executing update script with python: ${errorInfoPy.stderr || errorInfoPy.stdout || (errorInfoPy.error ? errorInfoPy.error.message : 'Unknown error')}. Python command used: ${errorInfoPy.pythonCmdUsed}`);
                    }
                } else {
                    // Error with python3 was not ENOENT, or it was some other script error
                    console.error("Error executing Python script with python3:", errorInfoP3.stderr || errorInfoP3.stdout || errorInfoP3.error);
                    throw new Error(`Error executing update script with python3: ${errorInfoP3.stderr || errorInfoP3.stdout || (errorInfoP3.error ? errorInfoP3.error.message : 'Unknown error')}. Python command used: ${errorInfoP3.pythonCmdUsed}`);
                }
            }
            
            console.log("Python script stdout:", scriptResult.stdout);
            if (scriptResult.stderr) { // Log stderr even on "successful" exit code 0 if present
                console.warn("Python script stderr:", scriptResult.stderr);
            }

            settings.lastUpdated = new Date().toLocaleString();
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            console.log(`Definitions updated. Last updated set to: ${settings.lastUpdated}. Python command used: ${scriptResult.pythonCmdUsed}`);
            
            if (win) {
                win.webContents.send('settingsUpdated', settings);
            }
            return { success: true, message: scriptResult.stdout.trim() || 'Definitions updated successfully.', lastUpdated: settings.lastUpdated, pythonCmdUsed: scriptResult.pythonCmdUsed };

        } catch (error) {
            console.error("Error in updateDefinitions main catch block:", error);
            return { success: false, message: error.message || "An unknown error occurred during definition update." };
        } finally {
            if (tempFeedPath && fs.existsSync(tempFeedPath)) {
                try {
                    fs.unlinkSync(tempFeedPath);
                    console.log(`Temporary feed file ${tempFeedPath} deleted.`);
                } catch (delError) {
                    console.error(`Error deleting temporary feed file ${tempFeedPath}:`, delError);
                }
            }
        }
    });

    try {
        // Settings are already loaded and potentially modified above for lastUpdated
        // settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')); 
        global.settings = settings; // Ensure global settings is also up-to-date
        console.log("Settings Loaded:", settings);
    } catch (err) {
        // This catch might not be necessary if settings are guaranteed by the require and initialization above
        console.error("Error re-loading/re-parsing settings:", err);
    }

    tray = new Tray(icon)
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                win.show();
            }
        },
        {
            label: 'Quit', click: function () {
                isQuiting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('dePWNer is Active ✅')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
        if (win.isVisible()) {
            win.hide()
        } else {
            win.show()
        }
    });


    createWindow()

    win.on('close', function (event) {
        if (!isQuiting) {
            event.preventDefault();
            win.hide();
            new Notification({
                title: "dePWNer is still Active",
                body: "Active in the background, you can go to system tray to Quit",
                silent: true
            }).show()
        }

        return false;
    });

    console.log("Main window loaded, starting watcher...");
    startWatcher();

    // Pre-load CSV database.
    // preloadCsv();
    scheduleScanning()
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
