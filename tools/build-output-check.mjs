import fs from 'fs';
import path from 'path';

const REQUIRED_STRINGS = [
  'Analyzer runtime fix',
  'hidden-required-first-pass',
  'Hidden required empty fields found',
  'Hidden required field blocked submission'
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

  if (!allPassed) {
    console.error('\nBuild verification FAILED! Built extension is missing critical runtime guard code.');
    process.exit(1);
  } else {
    console.log('\nBuild verification PASSED! All critical runtime guard code is present in built files.');
    process.exit(0);
  }
}

runBuildCheck();
