export function slugify(input: string, maxLen = 60) {
  const s = (input ?? '')
    .toString()
    .trim()
    .toLowerCase()
    // Remove diacritics (e.g. ö -> o)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // Keep only a-z, 0-9, spaces, and dashes
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  const out = s.slice(0, maxLen).replace(/-+$/g, '')
  return out
}


