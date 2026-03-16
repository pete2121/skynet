const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "dist", "skynet.min.js");
const outputPath = path.join(__dirname, "..", "dist", "skynet.bookmarklet.txt");

const code = fs.readFileSync(inputPath, "utf8").trim();
const bookmarklet = `javascript:${code}`;

fs.writeFileSync(outputPath, bookmarklet, "utf8");

console.log("Bookmarklet created:");
console.log(outputPath);