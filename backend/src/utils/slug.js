function slugify(input) {
  const s = (input || '').toString().trim().toLowerCase();
  if (!s) return '';
  return s
    // Vietnamese accents
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    // non-alphanum -> hyphen
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

module.exports = { slugify };

