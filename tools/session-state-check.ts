import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PANEL_COMPONENT_PATH = path.join(__dirname, '../src/ui/FormTracePanel.tsx');

const REQUIRED_STRINGS = [
  'Active page',
  'Recording since',
  'Current session report',
  'Saved report',
  'Exports use the currently opened report.',
  'Make sure the page you want to test is the active tab before starting a new recording.',
  "INSTÄLLNING - Recording start time display uses the user's local browser time."
];

async function runCheck() {
  console.log('--- Starting Session State Verification ---');

  if (!fs.existsSync(PANEL_COMPONENT_PATH)) {
    console.error('❌ Error: FormTracePanel.tsx not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(PANEL_COMPONENT_PATH, 'utf-8');
  let allFound = true;

  for (const str of REQUIRED_STRINGS) {
    if (!content.includes(str)) {
      console.error(`❌ Error: Required UI string not found: "${str}"`);
      allFound = false;
    } else {
      console.log(`[PASS] "${str}" found in source.`);
    }
  }

  if (allFound) {
    console.log('✅ Session State Verification PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Session State Verification FAILED!');
    process.exit(1);
  }
}

runCheck().catch(console.error);
