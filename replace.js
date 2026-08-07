import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath);
    } else if (
      fullPath.endsWith(".jsx") ||
      fullPath.endsWith(".js") ||
      fullPath.endsWith(".css") ||
      fullPath.endsWith(".html")
    ) {
      let content = fs.readFileSync(fullPath, "utf8");
      const original = content;
      content = content.replace(/PharmacyOS/g, "PharmaHub");
      content = content.replace(/pharmacyOS/g, "PharmaHub");
      content = content.replace(/PharmaOS/g, "PharmaHub");
      content = content.replace(/pharmacyos/g, "pharmahub");

      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf8");
        console.log("Updated:", fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, "src"));
console.log("Done.");
