/**
 * Returns true if an element is visually hidden from the user.
 * Considers display, visibility, opacity, dimensions, and the hidden attribute.
 */
export function isElementHidden(el: HTMLElement): boolean {
  if (!el || !el.isConnected) return true;

  const style = window.getComputedStyle(el);

  if (style.display === 'none') return true;
  if (style.visibility === 'hidden') return true;
  if (parseFloat(style.opacity) === 0) return true;

  // Zero-size element
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;

  // Explicit hidden attribute
  if (el.hidden) return true;

  // type="hidden" for inputs
  if ((el as HTMLInputElement).type === 'hidden') return true;

  // Walk up the DOM — if any ancestor is hidden, so is this element
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const pStyle = window.getComputedStyle(parent);
    if (
      pStyle.display === 'none' ||
      pStyle.visibility === 'hidden' ||
      parseFloat(pStyle.opacity) === 0
    ) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

/**
 * Returns true if an element is visually outside the viewport.
 * This is NOT the same as hidden — off-screen elements may still be accessible.
 */
export function isOffScreen(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.right < 0 ||
    rect.bottom < 0 ||
    rect.left > window.innerWidth ||
    rect.top > window.innerHeight
  );
}

/**
 * Returns true if the element is a visible error/validation message
 * near the form (typically a div/span/p with an error class or role="alert").
 */
export function isVisibleErrorElement(el: HTMLElement): boolean {
  if (isElementHidden(el)) return false;
  const text = el.innerText?.trim() ?? '';
  if (text.length === 0) return false;
  return true;
}
