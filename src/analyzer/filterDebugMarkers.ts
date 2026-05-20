/**
 * Filters out internal development diagnostic messages from technical details.
 * Used to clean up user-facing reports while preserving original underlying findings.
 */
export function filterTechnicalDetailsForDebugMarkers(
  details: string[],
  showDebugMarkers: boolean
): string[] {
  if (showDebugMarkers) {
    return details;
  }

  // INSTÄLLNING - Ord/fraser som identifierar interna felsökningsrader i rapporten
  const DEBUG_MARKER_PATTERNS = [
    'Analyzer runtime fix:',
    'Popup normalization fix:',
    'Analyzer bundle active:',
    'Network probe injected',
    'Network probe active',
    'Network probe message received',
    'Network DOM signal detected'
  ];

  return details.filter((line) => {
    return !DEBUG_MARKER_PATTERNS.some((pattern) => line.includes(pattern));
  });
}

if (typeof window !== 'undefined') {
  (window as any)['filterTechnicalDetailsForDebugMarkers'] = filterTechnicalDetailsForDebugMarkers;
}
