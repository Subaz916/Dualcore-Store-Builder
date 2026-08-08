const SUPABASE_URL = 'https://vtmjewwatshbdermcpyc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bWpld3dhdHNoYmRlcm1jcHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzYyNTksImV4cCI6MjEwMTY1MjI1OX0.dZnIzEgmrtcKF6bJrxInDhZwC0sM7ri8Dci7GAQsa_Q';
const BUCKET = 'storefronts';

function getContentType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.woff')) return 'font/woff';
  if (path.endsWith('.woff2')) return 'font/woff2';
  if (path.endsWith('.ttf')) return 'font/ttf';
  return 'application/octet-stream';
}

async function fetchTimeout(url, opts, ms = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function supabaseRequest(method, path, body = null) {
  const res = await fetchTimeout(`${SUPABASE_URL}/storage/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${res.status}: ${err}`);
  }
  return res.json();
}

async function supabaseDownload(path) {
  const res = await fetchTimeout(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return res;
}

// ---------- In-memory caches (fast repeat loads within a warm environment) ----------
const SLUG_MAP_TTL = 60_000;   // slug→owner lookup cache
const FILE_KEY_CACHE_MAX = 64; // served file cache (page bytes), short-lived
const fileCache = new Map();   // storagePath → { ts, body, type }
const slugMapCache = new Map(); // slug → { ts, userId }

function fileCacheGet(key) {
  const hit = fileCache.get(key);
  if (!hit) return null;
  return hit;
}
function fileCacheSet(key, body, type) {
  const now = Date.now();
  if (fileCache.size >= FILE_KEY_CACHE_MAX) {
    const oldest = fileCache.entries().next().value;
    fileCache.delete(oldest[0]);
  }
  fileCache.set(key, { ts: now, body, type });
}
function slugMapGet(slug) {
  const hit = slugMapCache.get(slug);
  if (!hit || Date.now() - hit.ts > SLUG_MAP_TTL) return null;
  return hit;
}

// In-flight dedupe: only one bucket listing at a time.
let listingPromise = null;
async function rootFolders() {
  if (!listingPromise) {
    listingPromise = supabaseRequest('POST', '/object/list/', { bucket: BUCKET, prefix: '', limit: 1000 })
      .catch(() => null)
      .finally(() => { listingPromise = null; });
  }
  return listingPromise;
}

// Resolve a store slug to its owner user_id (cached for SLUG_MAP_TTL).
async function findOwnerForSlug(slug) {
  const hit = slugMapGet(slug);
  if (hit) return hit.userId;
  const listRes = await rootFolders();
  if (!listRes?.folders) return null;

  // List each user folder once (in parallel) and rebuild the slug→owner map.
  const jobs = listRes.folders.map(async (folder) => {
    try {
      const userListRes = await supabaseRequest('POST', '/object/list/', {
        bucket: BUCKET,
        prefix: folder.name + '/',
        limit: 100,
      });
      return { folder: folder.name, slugs: (userListRes?.folders || []).map(f => f.name) };
    } catch { return null; }
  });

  const all = await Promise.all(jobs);
  const now = Date.now();
  for (const entry of all) {
    if (!entry) continue;
    for (const name of entry.slugs) {
      slugMapCache.set(name, { ts: now, userId: entry.folder });
    }
  }
  const found = slugMapGet(slug);
  return found ? found.userId : null;
}

// App routes that should NOT be treated as store slugs
const APP_ROUTES = new Set([
  '', 'index', 'index.html', 'login', 'login.html', 'signup', 'signup.html', 'forgot-password', 'forgot-password.html',
  'dashboard', 'dashboard.html', 'builder', 'builder.html', 'store', 'store.html', 'publish', 'publish.html',
  'products', 'products.html', 'orders', 'orders.html', 'customers', 'customers.html', 'analytics', 'analytics.html',
  'templates', 'templates.html', 'template-select', 'template-select.html', 'billing', 'billing.html',
  'settings', 'settings.html', 'admin', 'admin.html', 'features', 'features.html', 'about', 'about.html',
  'contact', 'contact.html', 'pricing', 'pricing.html'
]);

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip API, assets, static files, favicon
  if (pathname.startsWith('/api') || pathname.startsWith('/assets') ||
      pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return;
  }

  // Extract first path segment as potential slug
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return; // root path - let app handle

  const slug = segments[0];

  // Skip if it's a known app route (has .html extension or in APP_ROUTES)
  if (slug.endsWith('.html') || APP_ROUTES.has(slug)) {
    return;
  }

  // Determine the file path within the store
  let filePath = segments.length > 1 ? segments.slice(1).join('/') : 'index.html';
  if (!filePath || filePath.endsWith('/')) filePath += 'index.html';

  try {
    // Find which user_id owns this slug (cached).
    const userId = await findOwnerForSlug(slug);

    if (!userId) {
      return; // Not a store slug - let app handle (404 or SPA)
    }

    // Fetch the file from Supabase Storage (memory-cached for fast repeats).
    const storagePath = `${userId}/${slug}/${filePath}`;
    const hit = fileCacheGet(storagePath);
    if (hit && Date.now() - hit.ts < 10_000) {
      return new Response(hit.body, {
        headers: { 'Content-Type': hit.type, 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    }

    let downloadRes = await supabaseDownload(storagePath);

    // If not found and it's not index.html, try index.html for SPA routes
    if (!downloadRes && filePath !== 'index.html') {
      downloadRes = await supabaseDownload(`${userId}/${slug}/index.html`);
    }

    if (!downloadRes) {
      return;
    }

    const contentType = getContentType(filePath);
    const arrayBuffer = await downloadRes.arrayBuffer();
    fileCacheSet(storagePath, arrayBuffer, contentType);

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': filePath === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Middleware error:', err);
    return;
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};