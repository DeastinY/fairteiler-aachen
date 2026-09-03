/** Insert zero-width break opportunities after slashes so compound names
 * like "Bayernallee/Kalverbenden" wrap at the slash instead of mid-word
 * (browsers refuse to hyphenate tokens containing "/"). */
export function softBreakSlashes(text: string): string {
  return text.replace(/\//g, '/​')
}
