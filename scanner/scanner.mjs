#!/usr/bin/env node

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";
import process from "process";
import readline from "readline"; // <-- new import

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

// Updated loadBloomFilter using Set
function loadBloomFilter(hashDir = "virusshare_hashes") {
  const md5Set = new Set();
  if (!fs.existsSync(hashDir)) {
    console.log(`Hash directory '${hashDir}' not found, skipping Set creation`);
    return md5Set;
  }

  let hashCount = 0;
  const files = fs.readdirSync(hashDir);
  for (const filename of files) {
    const filepath = path.join(hashDir, filename);
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const hashStr = line.trim();
        if (hashStr) {
          md5Set.add(hashStr);
          hashCount++;
        }
      }
    } catch (err) {
      console.error(`Error reading ${filepath}: ${err}`);
    }
  }
  console.log(`Loaded ${hashCount} hashes into Set`);
  return md5Set;
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
function runYaraScan(filePath, rulesPath = "../output.yarc") {
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

// Updated scanFile: run YARA scan only if no hash-based match found.
function scanFile(filePath, bloomDbs1, signatures, bloomFilter2, yaraRules) {
  const hashes = computeHashes(filePath);
  if (!hashes) {
    return { matched: false, result: "hash_error" };
  }

  // Check primary hash-based match.
  if (bloomDbs1.md5.has(hashes.md5) && signatures[hashes.md5]) {
    console.log("Match found using primary hash.");
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

  // Check secondary hash-based match.
  if (bloomFilter2.has(hashes.md5)) {
    console.log("Match found using secondary hash.");
    return {
      matched: true,
      result: {
        type: "secondary_bloom",
        hash: hashes.md5,
        file: filePath,
      },
    };
  }

  // If no hash match was found, run YARA scan.
  console.log("No hash match found, running YARA scan.");
  const yaraResult = runYaraScan(filePath, yaraRules);
  if (yaraResult) {
    console.log("YARA match found.");
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

// Recursively get all files from a directory.
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// Scan a folder recursively using all detection methods.
function scanFolder(folder, bloomDbs1, signatures, bloomFilter2, yaraRules) {
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
        secondary_bloom: 0,
        yara: 0,
      },
    },
    matched_files: [],
  };

  console.log(`Scanning ${totalFiles} files...`);
  let count = 0;
  for (const filePath of allFiles) {
    const { matched, result } = scanFile(filePath, bloomDbs1, signatures, bloomFilter2, yaraRules);
    if (matched) {
      results.scan_summary.matches[result.type] += 1;
      results.matched_files.push(result);
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

// Exportable scanInput function: accepts an options object and returns JSON scan results.
export async function scanInput(options) {
  // options: { dbPath, bloomDir, yaraPath, filePath, folderPath }
  if (!options.dbPath) throw new Error("--db option is required");
  if (!options.filePath && !options.folderPath)
    throw new Error("Either filePath or folderPath option is required");

  const startTime = Date.now();
  console.log("Initial Memory Usage:", formatMem(process.memoryUsage()));

  const { bloomFilters, signatures } = await loadCsvToBloom(options.dbPath);
  const bloomFilter2 = loadBloomFilter(options.bloomDir || "virusshare_hashes");
  console.log("Databases loaded, ready to scan");

  let results;
  if (options.filePath) {
    results = scanFile(options.filePath, bloomFilters, signatures, bloomFilter2, options.yaraPath || "./packages/full/yara-rules-full.yar");
  } else {
    results = scanFolder(options.folderPath, bloomFilters, signatures, bloomFilter2, options.yaraPath || "./packages/full/yara-rules-full.yar");
  }

  console.log("Scan completed in", (Date.now() - startTime) / 1000, "seconds");
  console.log("Final Memory Usage:", formatMem(process.memoryUsage()));
  return results;
}

// For command-line usage.
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  (async () => {
    const args = process.argv.slice(2);
    let dbPath = null, bloomDir = "virusshare_hashes", yaraPath = "./packages/full/yara-rules-full.yar", filePath = null, folderPath = null;
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case "--db":
          dbPath = args[++i];
          break;
        case "--bloom-dir":
          bloomDir = args[++i];
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
      const result = await scanInput({ dbPath, bloomDir, yaraPath, filePath, folderPath });
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
