const SUPABASE_URL = 'https://vtmjewwatshbdermcpyc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bWpld3dhdHNoYmRlcm1jcHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzYyNTksImV4cCI6MjEwMTY1MjI1OX0.dZnIzEgmrtcKF6bJrxInDhZwC0sM7ri8Dci7GAQsa_Q';
const BUCKET = 'storefronts';
const PLATFORM_DOMAIN = 'dualcore.shop';

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

export default async function middleware(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const pathname = url.pathname;

  // Skip if not a subdomain of our platform domain
  if (!hostname.endsWith(`.${PLATFORM_DOMAIN}`) || hostname === PLATFORM_DOMAIN) {
    return;
  }

  // Extract slug from subdomain (e.g., "mystore.dualcore.shop" -> "mystore")
  const slug = hostname.replace(`.${PLATFORM_DOMAIN}`, '');
  if (!slug || slug === 'www') {
    return;
  }

  // Determine the file path
  let filePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!filePath) filePath = 'index.html';

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
        // folder.name is user_id
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
      return;
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