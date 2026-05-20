import fs from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_DIR = path.join(__dirname, '../demo-pages');

const expectedDemos = [
  {
    file: 'react-like-controlled-form.html',
    mustInclude: ['React-like Controlled Form', 'display: none', 'e.preventDefault()']
  },
  {
    file: 'vue-like-conditional-form.html',
    mustInclude: ['Vue-like Conditional Form', 'v-show-hidden', 'display: none !important']
  },
  {
    file: 'angular-like-disabled-submit.html',
    mustInclude: ['Angular-like', 'ng-invalid', 'btn.disabled = true']
  },
  {
    file: 'custom-validation-no-visible-error.html',
    mustInclude: ['Custom Validation', 'novalidate', 'form.checkValidity()']
  },
  {
    file: 'async-submit-api-error.html',
    mustInclude: ['Async API Error', 'fetch(', '/api/non-existent-endpoint-12345']
  },
  // Existing ones
  { file: 'hidden-required-field.html', mustInclude: ['Ghosts'] || ['Hidden Required Field Test'] },
  { file: 'disabled-button.html', mustInclude: ['Disabled Submit Button'] },
  { file: 'invisible-error.html', mustInclude: ['Invisible Error Test'] },
  { file: 'failed-api.html', mustInclude: ['Failed API Test'] },
  { file: 'success-form.html', mustInclude: ['Success Test'] }
];

function runFrameworkDemoCheck() {
  console.log('--- Starting Framework Demo Check ---');
  let allPassed = true;

  if (!fs.existsSync(DEMO_DIR)) {
    console.error(`[FAIL] Demo directory not found: ${DEMO_DIR}`);
    process.exit(1);
  }

  for (const demo of expectedDemos) {
    const filePath = path.join(DEMO_DIR, demo.file);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] Demo file is missing: ${demo.file}`);
      allPassed = false;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Check for unwanted external dependencies
    if (content.includes('unpkg.com') || content.includes('cdnjs.cloudflare.com') || content.includes('cdn.jsdelivr.net')) {
      console.error(`[FAIL] ${demo.file} includes external CDN dependencies!`);
      allPassed = false;
    }

    // Check for expected strings
    for (const str of demo.mustInclude) {
      if (!content.includes(str)) {
        // Fallback for hidden-required-field text differences over time
        if (str === 'Ghosts' && content.includes('Hidden Required Field Test')) continue;
        
        console.error(`[FAIL] ${demo.file} is missing expected string: "${str}"`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log(`[PASS] ${demo.file} is valid.`);
    }
  }

  // Check index.html exists and links to new demos
  const indexFile = path.join(DEMO_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    const indexContent = fs.readFileSync(indexFile, 'utf8');
    for (const demo of expectedDemos) {
      if (!indexContent.includes(demo.file)) {
        console.error(`[FAIL] index.html is missing link to ${demo.file}`);
        allPassed = false;
      }
    }
    if (allPassed) {
      console.log('[PASS] index.html links to all required demos.');
    }
  } else {
    console.error(`[FAIL] index.html is missing`);
    allPassed = false;
  }

  if (!allPassed) {
    console.error('\nFramework Demo Check FAILED!');
    process.exit(1);
  } else {
    console.log('\nFramework Demo Check PASSED!');
    process.exit(0);
  }
}

runFrameworkDemoCheck();
