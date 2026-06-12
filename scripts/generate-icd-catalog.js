const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputPath = process.argv[2];
const outputPath =
  process.argv[3] ||
  path.resolve(__dirname, '../src/assets/icd-11-mms-en.json');

if (!inputPath) {
  console.error('Usage: npm run icd:generate -- <workbook.xlsx> [output.json]');
  process.exit(1);
}

const workbook = XLSX.readFile(path.resolve(inputPath), { dense: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

const cleanTitle = (value) =>
  String(value)
    .replace(/^(?:-\s*)+/, '')
    .trim();

const versionColumn = Object.keys(rows[0] || {}).find((key) =>
  key.startsWith('Version:'),
);
const version = versionColumn
  ? versionColumn.replace(/^Version:/, '').trim()
  : 'unknown';

const seenCodes = new Set();
const diagnoses = [];

for (const row of rows) {
  const code = String(row.Code || '').trim();
  const title = cleanTitle(row.Title);
  if (!code || !title) continue;
  if (seenCodes.has(code)) {
    throw new Error(`Duplicate ICD-11 code found: ${code}`);
  }
  seenCodes.add(code);
  diagnoses.push({ code, title });
}

const catalog = {
  metadata: {
    source: path.basename(inputPath),
    sheet: sheetName,
    version,
    generatedAt: new Date().toISOString(),
    count: diagnoses.length,
  },
  diagnoses,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(catalog));
console.log(
  `Generated ${diagnoses.length} ICD-11 diagnoses at ${outputPath} (${version})`,
);
