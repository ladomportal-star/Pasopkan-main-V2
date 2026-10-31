const imageFields = new Set(['avatarUrl', 'coverImageUrl', 'zoneImageUrl', 'logoUrl']);
type Upload = (data: string, visibility: 'public' | 'private') => Promise<string>;
type Resolve = (reference: string) => Promise<string>;

/** Upload only known image fields. Descriptions and arbitrary strings are never uploads. */
export async function prepareMedia(
  value: unknown,
  upload: Upload,
  cache = new Map<string, Promise<string>>(),
): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map(v => prepareMedia(v, upload, cache)));
  if (!value || typeof value !== 'object') return value;
  const uploadOnce = (data: string, visibility: 'public' | 'private') => {
    const cacheKey = `${visibility}:${data}`;
    let pending = cache.get(cacheKey);
    if (!pending) {
      pending = upload(data, visibility);
      cache.set(cacheKey, pending);
    }
    return pending;
  };
  const out: Record<string, unknown> = { ...value };
  for (const [key, entry] of Object.entries(out)) {
    if (imageFields.has(key) && typeof entry === 'string' && entry.startsWith('data:')) {
      out[key] = await uploadOnce(entry, key === 'avatarUrl' ? 'private' : 'public');
    } else if (key === 'galleryUrls' && Array.isArray(entry)) {
      out[key] = await Promise.all(entry.map(v => typeof v === 'string' && v.startsWith('data:') ? uploadOnce(v, 'public') : v));
    } else if (entry && typeof entry === 'object') out[key] = await prepareMedia(entry, upload, cache);
  }
  return out;
}

/** Canonical references remain unchanged; temporary display URLs are separate fields. */
export async function resolveMedia(
  value: unknown,
  resolve: Resolve,
  cache = new Map<string, Promise<string>>(),
): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map(v => resolveMedia(v, resolve, cache)));
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = { ...value };
  const display = async (v: unknown) => {
    if (typeof v !== 'string' || !v.startsWith('storage://')) return v;
    let pending = cache.get(v);
    if (!pending) {
      pending = resolve(v).catch(() => '');
      cache.set(v, pending);
    }
    return pending;
  };
  for (const [key, entry] of Object.entries(out)) {
    if (imageFields.has(key)) out[key + 'Display'] = await display(entry);
    else if (key === 'galleryUrls' && Array.isArray(entry)) out.galleryUrlsDisplay = await Promise.all(entry.map(display));
    else if (entry && typeof entry === 'object') out[key] = await resolveMedia(entry, resolve, cache);
  }
  return out;
}
