// worker.js

const FPL_BASE = 'https://fantasy.premierleague.com/api';
const ALLOWED_ORIGIN = 'https://littlesheepdesign-max.github.io';

/**
 * Cloudflare Worker entry point
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1) Handle CORS preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // 2) Health check / root
    if (pathname === '/') {
      return new Response('OK', {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }

    // 3) /api/data → FPL bootstrap-static
    if (pathname === '/api/data' && request.method === 'GET') {
      return proxyFPL(`${FPL_BASE}/bootstrap-static/`);
    }

    // 4) /api/live/:gw → FPL live event
    if (pathname.startsWith('/api/live/') && request.method === 'GET') {
      const segments = pathname.split('/').filter(Boolean); // ['', 'api', 'live', 'GW'] → ['api','live','GW']
      const gw = segments[2]; // 'GW'
      if (!gw) {
        return jsonResponse(
          { error: 'Gameweek (gw) parameter is required' },
          400
        );
      }
      return proxyFPL(`${FPL_BASE}/event/${gw}/live/`);
    }

    // 5) Not found
    return jsonResponse({ error: 'Not found' }, 404);
  },
};

/**
 * Proxy a request to the FPL API and return JSON with CORS headers
 */
async function proxyFPL(targetUrl) {
  try {
    const res = await fetch(targetUrl);

    if (!res.ok) {
      console.error(
        'Error from FPL API:',
        res.status,
        res.statusText,
        'URL:',
        targetUrl
      );
      return jsonResponse(
        { error: 'Failed to fetch data from FPL API' },
        500
      );
    }

    const data = await res.json();
    return jsonResponse(data, 200);
  } catch (error) {
    console.error('Error fetching data from FPL API:', error);
    return jsonResponse(
      { error: 'Failed to fetch data', details: String(error) },
      500
    );
  }
}

/**
 * Standard JSON response helper with CORS
 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    },
  });
}

/**
 * Handle CORS preflight
 */
function handleOptions(request) {
  const headers = request.headers;
  const origin = headers.get('Origin');

  // Only respond with CORS if origin is present
  if (origin !== null) {
    const respHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': headers.get(
        'Access-Control-Request-Headers'
      ) || 'Content-Type',
      'Access-Control-Max-Age': '86400', // cache preflight response
    };

    return new Response(null, {
      status: 204,
      headers: respHeaders,
    });
  }

  // Non-CORS OPTIONS
  return new Response(null, { status: 204 });
}
