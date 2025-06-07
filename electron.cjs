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
    // The python script and its copying logic have been removed.
    // The static/ directory in user's dataDir is no longer created by this logic.
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

    // Updated IPC handler for updating definitions using better-sqlite3
    ipcMain.handle("updateDefinitions", async () => {
        let db; // Declare db here to be accessible in finally block
        try {
            console.log("Fetching latest definitions from Malware Bazaar (CSV)...");
            const response = await fetch('https://bazaar.abuse.ch/export/csv/recent/');
            if (!response.ok) {
                throw new Error(`Failed to fetch definitions: ${response.statusText}`);
            }
            const csvData = await response.text();
            console.log("Fetched CSV definitions (first 500 chars):", csvData.substring(0, 500));

            const dbPath = settings.yara ? path.join(scannerDir, 'malware_hashes.db') : path.join(dataDir, 'simple_malware_hashes.db');
            if (!fs.existsSync(dbPath)) {
                // Attempt to create the directory for simple_malware_hashes.db if it doesn't exist
                if (!settings.yara) {
                    const simpleDbDir = path.dirname(dbPath);
                    if (!fs.existsSync(simpleDbDir)) {
                        fs.mkdirSync(simpleDbDir, { recursive: true });
                        console.log(`Created directory for simple_malware_hashes.db: ${simpleDbDir}`)
                    }
                } else if (!fs.existsSync(scannerDir)) {
                     // This case should ideally be handled by first-run setup for scannerDir
                    throw new Error(`Scanner directory not found at ${scannerDir}. Cannot create malware_hashes.db.`);
                }
                // For simple_malware_hashes.db, it will be created by better-sqlite3 if it doesn't exist
                // For malware_hashes.db (Yara), it's expected to be part of the scanner setup.
                // However, the CREATE TABLE IF NOT EXISTS will handle table creation in both.
                console.log(`Database will be created or opened at: ${dbPath}`);
            }

            db = require('better-sqlite3')(dbPath);
            console.log(`Database opened successfully at ${dbPath}`);

            // Ensure table exists
            db.exec(`
                CREATE TABLE IF NOT EXISTS malware_hashes (
                    md5_hash TEXT PRIMARY KEY,
                    first_seen_utc TEXT,
                    signature TEXT
                )
            `);

            const lines = csvData.split('\n');
            let headerFields = [];
            let md5Index = -1, firstSeenIndex = -1, signatureIndex = -1;
            let addedCount = 0;
            let processedCount = 0;
            let dataRows = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                if (line.startsWith('#')) {
                    if (headerFields.length === 0) { // Check if this is the last comment line before actual headers
                        const potentialHeaderLine = lines[i+1];
                        if (potentialHeaderLine && !potentialHeaderLine.startsWith("#")) {
                             // Example header from problem: # "first_seen_utc"	sha256_hash	md5_hash	sha1_hash	reporter	file_name	file_type_guess	mime_type	signature	clamav	vtpercent	imphash	ssdeep	tlsh
                             // The actual CSV uses comma delimiter and quotes.
                             // Example actual header: "first_seen_utc","sha256_hash","md5_hash","sha1_hash","reporter","file_name","file_type_guess","mime_type","signature","clamav","vtpercent","imphash","ssdeep","tlsh"
                            let rawHeaders = lines[i].substring(1).trim(); // Remove '#'
                            if (rawHeaders.includes('\t')) { // Handle tab-delimited header in comment
                                headerFields = rawHeaders.split('\t').map(h => h.trim().replace(/^"|"$/g, ''));
                            } else if (rawHeaders.includes(',')) { // Handle comma-delimited header in comment (less likely for the # line)
                                 headerFields = rawHeaders.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                            }
                        }
                    }
                    continue;
                }

                if (headerFields.length === 0) { // This is the actual CSV header row
                    headerFields = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                    md5Index = headerFields.indexOf('md5_hash');
                    firstSeenIndex = headerFields.indexOf('first_seen_utc');
                    signatureIndex = headerFields.indexOf('signature');

                    if (md5Index === -1 || firstSeenIndex === -1 || signatureIndex === -1) {
                        throw new Error(`Required header field (md5_hash, first_seen_utc, or signature) not found in CSV. Found: ${headerFields.join(', ')}`);
                    }
                    continue; // Skip processing the header row as data
                }
                dataRows.push(line);
            }

            const totalEntries = dataRows.length;
            if (totalEntries === 0) {
                return { success: true, message: 'No new data entries in the feed.', lastUpdated: settings.lastUpdated };
            }

            const checkStmt = db.prepare('SELECT 1 FROM malware_hashes WHERE md5_hash = ?');
            const insertStmt = db.prepare('INSERT INTO malware_hashes (md5_hash, first_seen_utc, signature) VALUES (?, ?, ?)');

            db.transaction(() => {
                for (const row of dataRows) {
                    const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const md5_hash = values[md5Index];
                    const first_seen_utc_val = values[firstSeenIndex];
                    let signature_val = values[signatureIndex];

                    if (!md5_hash || md5_hash.length !== 32) { // Basic MD5 validation
                        console.warn(`Skipping invalid MD5 hash: ${md5_hash} in row: ${row}`);
                        continue;
                    }

                    if (!signature_val || signature_val.toLowerCase() === 'n/a' || signature_val === '') {
                        signature_val = 'MalwareBazaar_Recent_CSV';
                    }

                    const exists = checkStmt.get(md5_hash);
                    if (!exists) {
                        try {
                            insertStmt.run(md5_hash, first_seen_utc_val, signature_val);
                            addedCount++;
                        } catch (insertError) {
                            console.error(`Failed to insert MD5 ${md5_hash}: ${insertError.message}. Row: ${row}`);
                        }
                    }
                    processedCount++;
                    if (win && processedCount % 100 === 0) {
                        win.webContents.send('updateProgress', { processed: processedCount, total: totalEntries });
                    }
                }
            })(); // Execute transaction

            if (win) {
                win.webContents.send('updateProgress', { processed: totalEntries, total: totalEntries, completed: true });
            }

            settings.lastUpdated = new Date().toLocaleString();
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            console.log(`Definitions updated. Added ${addedCount} new entries. Last updated set to: ${settings.lastUpdated}`);

            if (win) {
                win.webContents.send('settingsUpdated', settings);
            }
            return { success: true, message: `Added ${addedCount} new malware definitions from ${totalEntries} processed entries.`, lastUpdated: settings.lastUpdated };

        } catch (error) {
            console.error("Error in updateDefinitions (CSV/better-sqlite3):", error);
            if (win) { // Send error state for progress
                 win.webContents.send('updateProgress', { error: true, message: error.message });
            }
            return { success: false, message: `Error updating definitions. ${error.message}` };
        } finally {
            if (db) {
                db.close();
                console.log("Database connection closed.");
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
