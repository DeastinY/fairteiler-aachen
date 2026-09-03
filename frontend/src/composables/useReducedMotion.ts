/** True when the user asks for reduced motion (guarded for odd environments). */
export function prefersReducedMotion(): boolean {
  try {
    return (
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}
