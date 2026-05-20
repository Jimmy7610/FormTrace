import { filterTechnicalDetailsForDebugMarkers } from '../src/analyzer/filterDebugMarkers';

const testDetails = [
  'Forms detected: 1',
  'Submit attempts: 1',
  'Hidden required empty fields found: 1',
  'Analyzer runtime fix: hidden-required-first-pass',
  'Popup normalization fix: final-report-guard',
  'Analyzer bundle active: popup-local-normalized',
  'Network probe injected',
  'Network probe active',
  'Network probe message received',
  'Network DOM signal detected',
  'Disabled submit attempt detected: 1',
  'Network failure detected: 1',
  'Field: company_id, type: text, required: true, hidden: true'
];

console.log('--- Starting Debug Marker Filter Verification ---');

// 1. Test when showDebugMarkers is false
const filteredHidden = filterTechnicalDetailsForDebugMarkers(testDetails, false);

const expectedHidden = [
  'Forms detected: 1',
  'Submit attempts: 1',
  'Hidden required empty fields found: 1',
  'Disabled submit attempt detected: 1',
  'Network failure detected: 1',
  'Field: company_id, type: text, required: true, hidden: true'
];

if (JSON.stringify(filteredHidden) !== JSON.stringify(expectedHidden)) {
  console.error('[FAIL] Filtering with showDebugMarkers = false failed.');
  console.error('Expected:', expectedHidden);
  console.error('Got:', filteredHidden);
  process.exit(1);
} else {
  console.log('[PASS] Correctly filters out debug markers when showDebugMarkers is false.');
}

// 2. Test when showDebugMarkers is true
const filteredVisible = filterTechnicalDetailsForDebugMarkers(testDetails, true);

if (JSON.stringify(filteredVisible) !== JSON.stringify(testDetails)) {
  console.error('[FAIL] Filtering with showDebugMarkers = true failed.');
  process.exit(1);
} else {
  console.log('[PASS] Retains all lines (including debug markers) when showDebugMarkers is true.');
}

console.log('Debug Marker Filter Verification PASSED!');
process.exit(0);
