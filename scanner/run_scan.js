import { scanInput } from "./scanner.mjs";
import fs from "fs";

(async () => {
  // Setup options. Adjust the paths as needed.
  const options = {
    dbPath: "./full.csv",         // CSV file with detection database.
    folderPath: "/home/rdksupe/Malware",        // Folder to scan.,                // Optional: secondary set directory.
    yaraPath: "./output.yarc" // Optional: YARA rules file path.
  };

  try {
    const results = await scanInput(options);
    // Fallback to an empty object if results is undefined.
    const output = JSON.stringify(results || {}, null, 2);
    fs.writeFileSync("scan_results.json", output, "utf-8");
    console.log("Scan results saved to scan_results.json");
  } catch (err) {
    console.error("Error running scan:", err);
  }
})();
