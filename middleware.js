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

async function supabaseRequest(method, path, body = null) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
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
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return res;
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
    // Find which user_id owns this slug by listing bucket root folders
    const listRes = await supabaseRequest('POST', '/object/list/', {
      bucket: BUCKET,
      prefix: '',
      limit: 1000,
    });

    let userId = null;
    if (listRes?.folders) {
      for (const folder of listRes.folders) {
        const userListRes = await supabaseRequest('POST', '/object/list/', {
          bucket: BUCKET,
          prefix: folder.name + '/',
          limit: 100,
        });
        if (userListRes?.folders?.some(f => f.name === slug)) {
          userId = folder.name;
          break;
        }
      }
    }

    if (!userId) {
      return; // Not a store slug - let app handle (404 or SPA)
    }

    // Fetch the file from Supabase Storage
    const storagePath = `${userId}/${slug}/${filePath}`;
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