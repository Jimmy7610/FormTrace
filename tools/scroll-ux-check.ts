import fs from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STYLE_PATH = path.join(__dirname, '../entrypoints/popup/style.css');

const expectedStrings = [
  "Side Panel scrollbar width for easier manual scrolling",
  "Extra bottom padding so the last panel section is easy to reach",
  "scrollbar-gutter",
  ".sidepanel-mode"
];

function runScrollUxCheck() {
  console.log('Running Scroll UX verification...');
  
  if (!fs.existsSync(STYLE_PATH)) {
    console.error(`❌ style.css not found at ${STYLE_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(STYLE_PATH, 'utf8');
  let allFound = true;

  for (const str of expectedStrings) {
    if (content.includes(str)) {
      console.log(`✅ Found: "${str}"`);
    } else {
      console.error(`❌ Missing string: "${str}"`);
      allFound = false;
    }
  }

  if (!allFound) {
    console.error('❌ Scroll UX Verification FAILED!');
    process.exit(1);
  } else {
    console.log('✅ Scroll UX Verification PASSED!');
    process.exit(0);
  }
}

runScrollUxCheck();
