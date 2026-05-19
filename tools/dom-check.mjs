import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const DEMO_PAGES_DIR = path.join(process.cwd(), 'demo-pages');
let errors = 0;

function assert(condition, message, file) {
  if (!condition) {
    console.error(`[FAIL] ${file}: ${message}`);
    errors++;
  } else {
    console.log(`[PASS] ${file}: ${message}`);
  }
}

function checkIndexHtml() {
  const file = 'index.html';
  const filePath = path.join(DEMO_PAGES_DIR, file);
  if (!fs.existsSync(filePath)) return assert(false, 'File exists', file);

  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  assert(doc.title.includes('FormTrace') || doc.body.textContent.includes('FormTrace'), 'Contains title/name FormTrace', file);
  
  const links = Array.from(doc.querySelectorAll('a')).map(a => a.href);
  assert(links.includes('disabled-button.html'), 'Links to disabled-button.html', file);
  assert(links.includes('hidden-required-field.html'), 'Links to hidden-required-field.html', file);
  assert(links.includes('invisible-error.html'), 'Links to invisible-error.html', file);
  assert(links.includes('failed-api.html'), 'Links to failed-api.html', file);
  assert(links.includes('success-form.html'), 'Links to success-form.html', file);

  assert(doc.body.textContent.includes('How to test') || doc.body.textContent.toLowerCase().includes('instructions'), 'Contains testing instructions', file);
}

function checkDisabledButtonHtml() {
  const file = 'disabled-button.html';
  const filePath = path.join(DEMO_PAGES_DIR, file);
  if (!fs.existsSync(filePath)) return assert(false, 'File exists', file);

  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const form = doc.querySelector('form');
  assert(form || doc.body.textContent.includes('submit'), 'Contains form or clear test area', file);
  
  const submitBtn = doc.querySelector('button[type="submit"], input[type="submit"]');
  assert(submitBtn, 'Contains a submit button', file);
  assert(submitBtn && submitBtn.disabled, 'Submit button is disabled by default', file);
  
  assert(doc.body.textContent.includes('Submit button was disabled'), 'Mentions "Submit button was disabled"', file);
}

function checkHiddenRequiredFieldHtml() {
  const file = 'hidden-required-field.html';
  const filePath = path.join(DEMO_PAGES_DIR, file);
  if (!fs.existsSync(filePath)) return assert(false, 'File exists', file);

  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  assert(doc.querySelector('form'), 'Contains at least one form', file);
  
  const requiredFields = doc.querySelectorAll('input[required], select[required], textarea[required]');
  assert(requiredFields.length > 0, 'Contains at least one required input/select/textarea', file);
  
  let hasHiddenRequired = false;
  requiredFields.forEach(field => {
    const isHidden = field.type === 'hidden' || field.hasAttribute('hidden') || field.style.display === 'none' || field.style.visibility === 'hidden' || html.includes('display: none');
    const parentHidden = field.closest('[hidden]') || (field.parentElement && html.includes(`.${field.parentElement.className} { display: none; }`)) || field.closest('.hidden-field');
    if (isHidden || parentHidden) hasHiddenRequired = true;
  });
  
  assert(hasHiddenRequired, 'At least one required field is hidden', file);
  
  const submitBtn = doc.querySelector('button[type="submit"], input[type="submit"], button');
  assert(submitBtn, 'Contains a submit button', file);
  
  assert(doc.body.textContent.includes('Hidden required field blocked submission'), 'Mentions "Hidden required field blocked submission"', file);
}

function checkInvisibleErrorHtml() {
  const file = 'invisible-error.html';
  const filePath = path.join(DEMO_PAGES_DIR, file);
  if (!fs.existsSync(filePath)) return assert(false, 'File exists', file);

  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  assert(doc.querySelector('form'), 'Contains at least one form', file);
  assert(doc.querySelector('[required]') || html.includes('valid'), 'Contains at least one invalid/required scenario', file);
  
  // Check for hidden error element
  const hasHiddenError = html.includes('display: none') && html.includes('error');
  assert(hasHiddenError, 'Contains an error message element that is visually hidden', file);
  
  assert(doc.querySelector('button[type="submit"], input[type="submit"], button'), 'Contains a submit button', file);
  assert(doc.body.textContent.includes('Validation failed without visible feedback'), 'Mentions "Validation failed without visible feedback"', file);
}

function checkFailedApiHtml() {
  const file = 'failed-api.html';
  const filePath = path.join(DEMO_PAGES_DIR, file);
  if (!fs.existsSync(filePath)) return assert(false, 'File exists', file);

  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  assert(doc.querySelector('form'), 'Contains at least one form', file);
  assert(doc.querySelector('button[type="submit"], input[type="submit"], button'), 'Contains a submit button', file);
  assert(html.includes('fetch(') || html.includes('XMLHttpRequest'), 'Contains JavaScript that calls fetch or XMLHttpRequest', file);
  assert(doc.body.textContent.includes('Network request failed after submit'), 'Mentions "Network request failed after submit"', file);
}

function checkSuccessFormHtml() {
  const file = 'success-form.html';
  const filePath = path.join(DEMO_PAGES_DIR, file);
  if (!fs.existsSync(filePath)) return assert(false, 'File exists', file);

  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  assert(doc.querySelector('form'), 'Contains at least one form', file);
  assert(doc.querySelector('input:not([type="hidden"])'), 'Contains valid user-fillable fields', file);
  assert(doc.querySelector('button[type="submit"], input[type="submit"], button'), 'Contains a submit button', file);
  assert(doc.body.textContent.includes('No clear failure detected'), 'Mentions "No clear failure detected"', file);
}

console.log('--- Starting DOM Verification ---');
checkIndexHtml();
checkDisabledButtonHtml();
checkHiddenRequiredFieldHtml();
checkInvisibleErrorHtml();
checkFailedApiHtml();
checkSuccessFormHtml();

if (errors > 0) {
  console.error(`\nDOM Verification FAILED with ${errors} errors.`);
  process.exit(1);
} else {
  console.log('\nDOM Verification PASSED!');
  process.exit(0);
}
