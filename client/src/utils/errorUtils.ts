/**
 * Extracts error message from unknown error object
 * @param err - The error object
 * @param fallback - Default message if no error message found
 * @returns Error message string
 */
export function getErrorMessage(
  err: unknown,
  fallback: string = 'An error occurred'
): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message?: string }).message;
    return message || fallback;
  }
  return fallback;
}
