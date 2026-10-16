#!/usr/bin/env node
/* SIS "One More Thing" scene QA — dependency-free, read-only, local-only.
 * Checks the isolated public meme surface at index.html:
 *   - the five request stages and their canonical SIS-### part IDs exist
 *   - the four endings exist
 *   - the mock employee report and its copy control exist
 *   - a single polite live region and a reduced-motion guard exist
 *   - no banned network / storage / wallet / URL constructs appear
 * Reads one file only. Never writes, never runs a network call, never touches
 * providers, wallets, storage or devices.
 * Run: node tools/sis-onemorething-qa.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "index.html");

const problems = [];
const notes = [];

if (!fs.existsSync(FILE) || fs.statSync(FILE).size === 0) {
  console.log("FAIL missing or empty index.html");
  process.exit(1);
}

const raw = fs.readFileSync(FILE, "utf8");
notes.push("bytes: " + fs.statSync(FILE).size);

function require_(label, needle) {
  if (raw.indexOf(needle) === -1) problems.push("missing " + label + " (" + needle + ")");
}

// five request stages with canonical part IDs
["SIS-081-W", "SIS-046-W", "SIS-075-D", "SIS-090-F", "SIS-039-W"].forEach(function (id) {
  require_("stage part " + id, id);
});
["also weld the gate", "also reach the top shelf", "also take the hits", "also run HR", "also cover the night shift"].forEach(function (r) {
  require_("stage request", r);
});

// four endings
["I QUIT", "PROMOTED TO MANAGEMENT", "OUTSOURCED TO HUMAN", "UNAVAILABLE"].forEach(function (e) {
  require_("ending", e);
});

// report + controls
["EMPLOYEE REPORT", "COPY REPORT", "RUN AGAIN", "WORST REQUEST", "VIEW REPORT"].forEach(function (k) {
  require_("report element", k);
});

// this polish pass: loose screw, replace employee, human productivity gauge, ball ending
require_("loose screw control", 'id="screw"');
require_("load-bearing joke", "load-bearing");
require_("replace employee control", 'id="replace"');
require_("view/reopen report control", 'id="viewreport"');
require_("human productivity gauge", "HUMAN PRODUCTIVITY");
require_("clipboard feedback region", 'id="copy-status"');
require_("moustache element", 'class="moustache"');
require_("ball ending element", 'class="ball"');

// accessibility + motion guard
require_("live region", 'aria-live="polite"');
require_("status role", 'role="status"');
require_("reduced-motion guard", "prefers-reduced-motion");
require_("reduced-motion catch-all", "animation-duration:.001ms");
require_("primary heading", "<h1");
require_("single interactive trigger", 'id="omt"');
require_("mobile breakpoint", "max-width:430px");

// cumulative stage markers 1..5
for (let n = 1; n <= 5; n++) require_("stage marker", 'data-at="' + n + '"');

// no banned constructs anywhere in the file (code + attributes)
const BANNED = [
  ["network", /\bfetch\s*\(/g],
  ["network", /\bXMLHttpRequest\b/g],
  ["network", /\bWebSocket\b/g],
  ["network", /\bEventSource\b/g],
  ["network", /\bsendBeacon\b/g],
  ["network", /\bhttps?:\/\//g],
  ["network", /@import\b/g],
  ["storage", /\blocalStorage\b/g],
  ["storage", /\bsessionStorage\b/g],
  ["storage", /\bindexedDB\b/g],
  ["storage", /\bdocument\.cookie\b/g],
  ["wallet", /\bwindow\.(?:solana|ethereum)\b/g],
  ["wallet", /\b(?:web3|ethers|Keypair)\b/g],
  ["wallet", /\b(?:privateKey|mnemonic|seedPhrase|secretKey)\b/g],
  ["wallet", /\b(?:signTransaction|signMessage|signAndSendTransaction)\b/g],
  ["wallet", /\bwallet(?:\.|\[|\(|=|Address\b|Connect\b|Adapter\b)/g],
  ["wallet", /\bwallet[A-Z_]/g],
  ["wallet", /\b(?:treasury|mint)\b/g]
];
BANNED.forEach(function (b) {
  b[1].lastIndex = 0;
  const hits = raw.match(b[1]);
  if (hits) problems.push("banned " + b[0] + " token x" + hits.length);
});

// relative asset references must resolve on disk
const refs = [];
const refRe = /(?:src|href)\s*=\s*("([^"]*)"|'([^']*)')/gi;
let m;
while ((m = refRe.exec(raw))) {
  const v = m[2] !== undefined ? m[2] : m[3];
  if (!v) continue;
  if (v.charAt(0) === "#") continue;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) { problems.push("absolute reference " + v); continue; }
  refs.push(v);
}
refs.forEach(function (r) {
  const clean = r.split("#")[0].split("?")[0];
  if (!clean) return;
  if (!fs.existsSync(path.resolve(path.dirname(FILE), clean))) problems.push("missing local asset " + clean);
});

// images must carry alt text
const imgs = raw.match(/<img\b[^>]*>/gi) || [];
imgs.forEach(function (t) { if (!/\balt\s*=/i.test(t)) problems.push("img without alt: " + t.slice(0, 60)); });

console.log("SIS One More Thing QA (read-only)");
console.log("file: " + path.relative(ROOT, FILE));
notes.forEach(function (n) { console.log("  " + n); });
console.log("  local refs: " + refs.length + "  images: " + imgs.length);
if (problems.length) {
  problems.forEach(function (p) { console.log("  FAIL " + p); });
  console.error("sis-onemorething-qa: FAILED (" + problems.length + ")");
  process.exit(1);
}
console.log("  PASS five stages, four endings, report, live region, reduced-motion, no banned tokens");
console.log("sis-onemorething-qa: all-pass");
