import type { VisibilityCause } from '../types/formtrace';

// INSTÄLLNING - Minimum rendered size before an element is considered visually collapsed.
const MIN_VISIBLE_SIZE_PX = 2;
// INSTÄLLNING - Maximum ancestor depth inspected for visibility causes.
const MAX_VISIBILITY_ANCESTOR_DEPTH = 6;

export function inspectElementVisibility(element: HTMLElement): VisibilityCause[] {
  const causes: VisibilityCause[] = [];

  // Element specific attributes
  if (element.hasAttribute('disabled') || (element as HTMLInputElement).disabled) {
    causes.push({
      type: 'disabled',
      message: 'element is disabled',
      source: 'element',
    });
  }

  if (element.hasAttribute('hidden')) {
    causes.push({
      type: 'hidden-attribute',
      message: 'element has hidden attribute',
      source: 'element',
    });
  }

  if (element.getAttribute('aria-hidden') === 'true') {
    causes.push({
      type: 'aria-hidden',
      message: 'element has aria-hidden',
      source: 'element',
    });
  }

  // Computed styles for the element itself
  const style = window.getComputedStyle(element);
  
  if (style.display === 'none') {
    causes.push({
      type: 'display-none',
      message: 'element has display:none',
      source: 'element',
    });
  }

  if (style.visibility === 'hidden' || style.visibility === 'collapse') {
    causes.push({
      type: 'visibility-hidden',
      message: 'element has visibility:hidden',
      source: 'element',
    });
  }

  if (style.opacity === '0' || parseFloat(style.opacity || '1') === 0) {
    causes.push({
      type: 'opacity-zero',
      message: 'element has opacity:0',
      source: 'element',
    });
  }

  if (style.pointerEvents === 'none') {
    causes.push({
      type: 'pointer-events-none',
      message: 'element has pointer-events:none',
      source: 'element',
    });
  }

  // Bounding rect (size and offscreen)
  const rect = element.getBoundingClientRect();
  if (rect.width <= MIN_VISIBLE_SIZE_PX || rect.height <= MIN_VISIBLE_SIZE_PX) {
    // Only flag zero-size if it isn't already display:none to avoid noise
    if (style.display !== 'none') {
      causes.push({
        type: 'zero-size',
        message: 'element has zero rendered size',
        source: 'element',
      });
    }
  } else {
    // Check if offscreen
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    if (
      rect.bottom < 0 ||
      rect.top > viewportHeight ||
      rect.right < 0 ||
      rect.left > viewportWidth
    ) {
      causes.push({
        type: 'offscreen',
        message: 'element is positioned offscreen',
        source: 'element',
      });
    }
  }

  // Ancestor check
  let currentAncestor = element.parentElement;
  let depth = 0;
  
  while (currentAncestor && depth < MAX_VISIBILITY_ANCESTOR_DEPTH) {
    const ancestorStyle = window.getComputedStyle(currentAncestor);
    
    if (ancestorStyle.display === 'none') {
      causes.push({
        type: 'hidden-ancestor',
        message: 'ancestor has display:none',
        source: 'ancestor',
      });
      break; // One hidden ancestor is enough explanation
    }

    if (ancestorStyle.visibility === 'hidden' || ancestorStyle.visibility === 'collapse') {
      causes.push({
        type: 'hidden-ancestor',
        message: 'ancestor has visibility:hidden',
        source: 'ancestor',
      });
      break;
    }

    if (ancestorStyle.opacity === '0' || parseFloat(ancestorStyle.opacity || '1') === 0) {
      causes.push({
        type: 'hidden-ancestor',
        message: 'ancestor has opacity:0',
        source: 'ancestor',
      });
      break;
    }
    
    if (currentAncestor.hasAttribute('hidden')) {
      causes.push({
        type: 'hidden-ancestor',
        message: 'ancestor has hidden attribute',
        source: 'ancestor',
      });
      break;
    }

    currentAncestor = currentAncestor.parentElement;
    depth++;
  }

  return causes;
}
