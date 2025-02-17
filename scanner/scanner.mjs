#!/usr/bin/env node

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";
import process from "process";
import readline from "readline"; // <-- new import
function loadWhitelist() {
  const whitelistPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'whitelist.txt');
  const whitelist = new Set();
  
  if (fs.existsSync(whitelistPath)) {
    const content = fs.readFileSync(whitelistPath, 'utf-8');
    content.split('\n').forEach(line => {
      const hash = line.trim();
      if (hash) whitelist.add(hash);
    });
    console.log(`Loaded ${whitelist.size} whitelist hashes`);
  }
  return whitelist;
}
// Updated loadCsvToBloom using Set with caching
export async function loadCsvToBloom(csvFile) {
  // If CSV data is already loaded, return cached data.
  if (global.preloadedCsvData) {
    console.log("Using preloaded CSV Data");
    return global.preloadedCsvData;
  }

  const md5Set = new Set();
  const signatures = {};
  let hashCount = 0;
  let md5Index, firstSeenIndex, signatureIndex;

  const stream = fs.createReadStream(csvFile, "utf-8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let headerProcessed = false;

  rl.on("line", (line) => {
    if (!headerProcessed) {
      const header = line.split(",").map(col => col.trim().replace(/^["']|["']$/g, "").toLowerCase());
      md5Index = header.indexOf("md5_hash");
      firstSeenIndex = header.indexOf("first_seen_utc");
      signatureIndex = header.indexOf("signature");
      console.log("Using MD5 column at index:", md5Index);
      headerProcessed = true;
    } else {
      if (!line.trim()) return;
      const row = line.split(",");
      if (md5Index !== -1 && row[md5Index]) {
        const hashVal = row[md5Index].trim().replace(/^["']|["']$/g, "").toLowerCase();
        md5Set.add(hashVal);
        signatures[hashVal] = {
          first_seen: row[firstSeenIndex] || "N/A",
          signature: row[signatureIndex] || "N/A"
        };
        hashCount++;
      }
    }
  });

  return new Promise((resolve, reject) => {
    // if (whitelist.has(hashes.md5)) {
    //   return {
    //     matched: false,
    //     result: {
    //       type: "whitelist",
    //       hash: hashes.md5,
    //       file: filePath,
    //     },
    //   };
      rl.on("close", () => {
      console.log("Loaded CSV MD5 hashes into Set:");
      console.log(`MD5: ${hashCount}`);
      const result = { bloomFilters: { md5: md5Set }, signatures };
      global.preloadedCsvData = result;
      resolve(result);
    });
    rl.on("error", (err) => reject(err));
  });
}

// Compute multiple hashes (SHA256, MD5, SHA1) of a file.
function computeHashes(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const md5 = crypto.createHash("md5").update(data).digest("hex").toLowerCase();
    return { md5 };
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err}`);
    return null;
  }
}

// Run YARA scan using an external command.
function runYaraScan(filePath, rulesPath = "./output.yarc") {
  try {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    // Update the command to point to the YARA binary inside the scanner directory.
    const cmd = path.join(__dirname, "yr");
    const args = ["scan", "-C", rulesPath, filePath];
    const result = spawnSync(cmd, args, { encoding: "utf-8" });
    console.log("YARA scan result:", result);
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
    return null;
  } catch (err) {
    console.error(`YARA scan error: ${err}`);
    return null;
  }
}

// New function to load whitelist


// New function to add hash to whitelist
function addToWhitelist(hash) {
  const whitelistPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'whitelist.txt');
  fs.appendFileSync(whitelistPath, hash + '\n');
}

// Modified scanFile function to automatically whitelist clean files
function scanFile(filePath, bloomDbs1, signatures, yaraRules) {
  const whitelist = loadWhitelist();
  const hashes = computeHashes(filePath);
  
  if (!hashes) {
    return { matched: false, result: "hash_error" };
  }

  // Check whitelist first
  if (whitelist.has(hashes.md5)) {
    return {
      matched: false,
      result: {
        type: "whitelist",
        hash: hashes.md5,
        file: filePath,
      },
    };
  }

  // If no DB is provided, run YARA scan directly
  if (!bloomDbs1) {
    const yaraResult = runYaraScan(filePath, yaraRules);
    if (yaraResult) {
      return {
        matched: true,
        result: {
          type: "yara",
          matches: yaraResult,
          file: filePath,
        },
      };
    }
    return { matched: false, result: null };
  }

  // If DB is provided, check hashes first
  // Check hash-based match
  if (bloomDbs1.md5.has(hashes.md5) && signatures[hashes.md5]) {
    return {
      matched: true,
      result: {
        type: "primary_bloom",
        hash_type: "md5",
        hash: hashes.md5,
        first_seen: signatures[hashes.md5].first_seen,
        signature: signatures[hashes.md5].signature,
        file: filePath,
      },
    };
  }

  // Run YARA scan
  const yaraResult = runYaraScan(filePath, yaraRules);
  if (yaraResult) {
    return {
      matched: true,
      result: {
        type: "yara",
        matches: yaraResult,
        file: filePath,
      },
    };
  }

  // If no matches found, add to whitelist
  addToWhitelist(hashes.md5);
  return {
    matched: false,
    result: {
      type: "new_whitelist",
      hash: hashes.md5,
      file: filePath,
    },
  };
}

// Recursively get all files from a directory.
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  // let num_of_files = list.length;


  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results ;
}

// Simplified scanFolder
function scanFolder(folder, bloomDbs1, signatures, yaraRules) {
  const allFiles = getAllFiles(folder);
  if (allFiles.length === 0) {
    console.log(JSON.stringify({ error: "No files found to scan." }, null, 2));
    return;
  }

  const totalFiles = allFiles.length;
  const results = {
    scan_summary: {
      total_files: totalFiles,
      matches: {
        primary_bloom: 0,
        yara: 0,
      },
      whitelisted: 0,
      new_whitelisted: 0,
    },
    matched_files: [],
    whitelisted_files: [],
    new_whitelisted_files: [],
  };

  console.log(`Scanning ${totalFiles} files...`);
  let count = 0;
  for (const filePath of allFiles) {
    let scanResult = scanFile(filePath, bloomDbs1, signatures, yaraRules);
    
    if (scanResult.result?.type === "whitelist") {
      results.scan_summary.whitelisted++;
      results.whitelisted_files.push(scanResult.result);
    } else if (scanResult.result?.type === "new_whitelist") {
      results.scan_summary.new_whitelisted++;
      results.new_whitelisted_files.push(scanResult.result);
    } else if (scanResult.matched) {
      results.scan_summary.matches[scanResult.result.type] += 1;
      results.matched_files.push(scanResult.result);
    }
    
    count++;
    process.stdout.write(`\rScanned: ${count}/${totalFiles}`);
  }
  console.log();

  const totalMatches = Object.values(results.scan_summary.matches).reduce((a, b) => a + b, 0);
  results.scan_summary.total_matches = totalMatches;
  results.scan_summary.match_percentage = totalFiles > 0 ? (totalMatches / totalFiles) * 100 : 0;

  console.log(JSON.stringify(results, null, 2));
}

// New helper to format memory usage in MB
function formatMem(usage) {
  const mb = x => (x / (1024 * 1024)).toFixed(2) + " MB";
  return {
    rss: mb(usage.rss),
    heapTotal: mb(usage.heapTotal),
    heapUsed: mb(usage.heapUsed),
    external: mb(usage.external),
    arrayBuffers: mb(usage.arrayBuffers || 0)
  };
}

// Simplified scanInput - remove autoWhitelist option
export async function scanInput(options) {
  // options: { dbPath, yaraPath, filePath, folderPath }
  if (!options.filePath && !options.folderPath) {
    throw new Error("Either filePath or folderPath option is required");
  }

  const startTime = Date.now();
  console.log("Initial Memory Usage:", formatMem(process.memoryUsage()));

  let bloomFilters = null;
  let signatures = null;

  if (options.dbPath) {
    const dbData = await loadCsvToBloom(options.dbPath);
    bloomFilters = dbData.bloomFilters;
    signatures = dbData.signatures;
    console.log("Database loaded, ready to scan");
  } else {
    console.log("No database provided, using YARA-only scan");
  }

  let results;
  if (options.filePath) {
    results = scanFile(
      options.filePath,
      bloomFilters,
      signatures,
      options.yaraPath || "./output.yarc"
    );
  } else {
    results = scanFolder(
      options.folderPath,
      bloomFilters,
      signatures,
      options.yaraPath || "./output.yarc"
    );
  }

  console.log("Scan completed in", (Date.now() - startTime) / 1000, "seconds");
  console.log("Final Memory Usage:", formatMem(process.memoryUsage()));
  return results;
}

// Updated command-line handling
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  (async () => {
    const args = process.argv.slice(2);
    let dbPath = null, yaraPath = "./output.yarc", filePath = null, folderPath = null;
    
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case "--db":
          dbPath = args[++i];
          break;
        case "--yara":
          yaraPath = args[++i];
          break;
        case "--file":
          filePath = args[++i];
          break;
        case "--folder":
          folderPath = args[++i];
          break;
        default:
          console.error(`Unknown argument: ${args[i]}`);
          process.exit(1);
      }
    }

    try {
      const result = await scanInput({ dbPath, yaraPath, filePath, folderPath });
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
