import fs from 'fs';
import path from 'path';

const REQUIRED_STRINGS = [
  'Analyzer runtime fix',
  'hidden-required-first-pass',
  'Hidden required empty fields found',
  'Hidden required field blocked submission',
  'Popup normalization fix: final-report-guard',
  'Analyzer bundle active: popup-local-normalized',
  'disabled-submit-attempt',
  'Disabled submit attempt detected',
  'Submit button was disabled at interaction time',
  'FormTraceNetworkProbe',
  'network-failure',
  'Network failure detected',
  'Network request failed after submit',
  'Network probe injected',
  'Network probe active',
  'Network probe message received',
  'network-failure-dom-signal',
  'Network DOM signal detected',
  'Show debug markers',
  'filterTechnicalDetailsForDebugMarkers',
  'Validation confidence combo bonus',
  'Copy GitHub issue',
  'buildGitHubIssueReport',
  'FormTrace:',
  'GitHub issue export active',
  'Copy Jira report',
  'buildJiraReport',
  'Jira report export active'
];

function getFilesRecursive(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

function runBuildCheck() {
  console.log('--- Starting Production Build Output Verification ---');
  const outputDir = path.resolve('.output/chrome-mv3');
  
  if (!fs.existsSync(outputDir)) {
    console.error(`[FAIL] Output directory does not exist: ${outputDir}`);
    process.exit(1);
  }

  const files = getFilesRecursive(outputDir).filter(f => f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.json') || f.endsWith('.css'));
  const foundMap = {};
  REQUIRED_STRINGS.forEach(str => {
    foundMap[str] = [];
  });

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    REQUIRED_STRINGS.forEach(str => {
      if (content.includes(str)) {
        foundMap[str].push(path.basename(file));
      }
    });
  });

  let allPassed = true;
  console.log('\nSearch Results in Build Output:');
  REQUIRED_STRINGS.forEach(str => {
    const matchingFiles = foundMap[str];
    if (matchingFiles.length > 0) {
      console.log(`[PASS] "${str}" found in: ${matchingFiles.join(', ')}`);
    } else {
      console.error(`[FAIL] "${str}" NOT found in any build output files!`);
      allPassed = false;
    }
  });

  const probeFile = files.find(f => path.basename(f) === 'page-network-probe.js');
  if (!probeFile) {
    console.error('[FAIL] page-network-probe.js is missing from the build output!');
    allPassed = false;
  } else {
    console.log('[PASS] page-network-probe.js exists in the build output.');
    const probeContent = fs.readFileSync(probeFile, 'utf8');
    if (!probeContent.includes('FormTraceNetworkProbe')) {
      console.error('[FAIL] page-network-probe.js does not contain "FormTraceNetworkProbe"!');
      allPassed = false;
    } else {
      console.log('[PASS] page-network-probe.js contains "FormTraceNetworkProbe".');
    }
  }

  const contentJsFile = files.find(f => f.endsWith('content.js'));
  if (contentJsFile) {
    const content = fs.readFileSync(contentJsFile, 'utf8');
    if (content.includes('__FormTraceNetworkProbeInstalled__')) {
      console.error('[FAIL] content.js contains "__FormTraceNetworkProbeInstalled__", indicating inline script was bundled!');
      allPassed = false;
    } else {
      console.log('[PASS] content.js does not contain inline probe code.');
    }

    const hasTextContentAssignment = /\.textContent\s*=/.test(content);
    const hasInnerHtmlAssignment = /\.innerHTML\s*=/.test(content);
    if (hasTextContentAssignment || hasInnerHtmlAssignment) {
      console.error('[FAIL] content.js seems to assign textContent or innerHTML, indicating inline injection!');
      allPassed = false;
    } else {
      console.log('[PASS] content.js does not assign textContent or innerHTML.');
    }
  }

  if (!allPassed) {
    console.error('\nBuild verification FAILED! Built extension is missing critical runtime guard code or violates CSP.');
    process.exit(1);
  } else {
    console.log('\nBuild verification PASSED! All critical runtime guard code is present in built files and complies with CSP.');
    process.exit(0);
  }
}

runBuildCheck();
