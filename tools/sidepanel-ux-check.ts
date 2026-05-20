import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PANEL_COMPONENT_PATH = path.join(__dirname, '../src/ui/FormTracePanel.tsx');

const REQUIRED_STRINGS = [
  'Side panel mode keeps FormTrace visible while you work on the page.',
  'Recording active',
  'Clears the current session, not saved history.',
  'Side panel'
];

async function runCheck() {
  console.log('Running Side Panel UX verification...');

  if (!fs.existsSync(PANEL_COMPONENT_PATH)) {
    console.error('❌ Error: FormTracePanel.tsx not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(PANEL_COMPONENT_PATH, 'utf-8');
  let allFound = true;

  for (const str of REQUIRED_STRINGS) {
    if (!content.includes(str)) {
      console.error(`❌ Error: Required UX string not found: "${str}"`);
      allFound = false;
    } else {
      console.log(`✅ Found: "${str}"`);
    }
  }

  if (allFound) {
    console.log('✅ Side Panel UX Verification PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Side Panel UX Verification FAILED!');
    process.exit(1);
  }
}

runCheck().catch(console.error);
