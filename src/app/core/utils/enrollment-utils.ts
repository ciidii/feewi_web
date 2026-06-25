const ACCENT_MAP: Record<string, string> = {
  à: 'a', â: 'a', ä: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e',
  î: 'i', ï: 'i', ô: 'o', ö: 'o', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n'
};

export function labelToCode(label: string): string {
  return label
    .toLowerCase()
    .replace(/[àâäéèêëîïôöùûüçñ]/g, c => ACCENT_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}
