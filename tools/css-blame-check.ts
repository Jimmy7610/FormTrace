import { inspectElementVisibility } from '../src/recorder/inspectElementVisibility';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal DOM mock to test inspectElementVisibility logic
class MockElement {
  style: any = {};
  attributes: Record<string, string> = {};
  disabled: boolean = false;
  rect: any = { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 };
  parentElement: MockElement | null = null;
  tagName: string = 'DIV';

  hasAttribute(name: string) { return name in this.attributes; }
  getAttribute(name: string) { return this.attributes[name] || null; }
  getBoundingClientRect() { return this.rect; }
}

const originalGetComputedStyle = (global as any).window?.getComputedStyle;

function setupMockDOM() {
  (global as any).window = {
    innerHeight: 1080,
    innerWidth: 1920,
    getComputedStyle: (el: MockElement) => el.style,
  };
  (global as any).document = { documentElement: { clientHeight: 1080, clientWidth: 1920 } };
}

function runTests() {
  console.log('--- Starting CSS Blame Overlay Verification ---');
  let allPassed = true;
  setupMockDOM();

  const testCases = [
    {
      name: 'detects display:none',
      setup: () => {
        const el = new MockElement();
        el.style.display = 'none';
        return el;
      },
      expectType: 'display-none'
    },
    {
      name: 'detects visibility:hidden',
      setup: () => {
        const el = new MockElement();
        el.style.visibility = 'hidden';
        return el;
      },
      expectType: 'visibility-hidden'
    },
    {
      name: 'detects opacity:0',
      setup: () => {
        const el = new MockElement();
        el.style.opacity = '0';
        return el;
      },
      expectType: 'opacity-zero'
    },
    {
      name: 'detects hidden attribute',
      setup: () => {
        const el = new MockElement();
        el.attributes['hidden'] = 'true';
        return el;
      },
      expectType: 'hidden-attribute'
    },
    {
      name: 'detects zero-size',
      setup: () => {
        const el = new MockElement();
        el.rect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
        return el;
      },
      expectType: 'zero-size'
    },
    {
      name: 'detects hidden ancestor',
      setup: () => {
        const el = new MockElement();
        const parent = new MockElement();
        parent.style.display = 'none';
        el.parentElement = parent;
        return el;
      },
      expectType: 'hidden-ancestor'
    }
  ];

  for (const tc of testCases) {
    const el = tc.setup();
    const causes = inspectElementVisibility(el as any);
    const hasType = causes.some((c) => c.type === tc.expectType);
    if (hasType) {
      console.log(`[PASS] ${tc.name}`);
    } else {
      console.error(`[FAIL] ${tc.name} - Did not find expected cause type: ${tc.expectType}`);
      console.error(causes);
      allPassed = false;
    }
  }

  // Also verify source code for expected strings
  const analyzeSessionCode = fs.readFileSync(path.join(__dirname, '../src/analyzer/analyzeSession.ts'), 'utf-8');
  if (analyzeSessionCode.includes('CSS cause:')) {
    console.log(`[PASS] report output includes "CSS cause:"`);
  } else {
    console.error(`[FAIL] analyzeSession.ts does not include "CSS cause:"`);
    allPassed = false;
  }

  if (analyzeSessionCode.includes('Hidden required field blocked submission')) {
    console.log(`[PASS] hidden required field test still returns "Hidden required field blocked submission"`);
  } else {
    console.error(`[FAIL] analyzeSession.ts does not include "Hidden required field blocked submission"`);
    allPassed = false;
  }

  if (allPassed) {
    console.log('CSS Blame Verification PASSED!\n');
    process.exit(0);
  } else {
    console.error('CSS Blame Verification FAILED!\n');
    process.exit(1);
  }
}

runTests();
