import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const lockPath = resolve(__dirname, "..", "package-lock.json");
const data = JSON.parse(readFileSync(lockPath, "utf8"));
writeFileSync(lockPath, `${JSON.stringify(data, null, 2)}\n`, { encoding: "utf8" });
