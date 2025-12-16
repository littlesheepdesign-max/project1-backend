// worker.js

const FPL_BASE = 'https://fantasy.premierleague.com/api';
const ALLOWED_ORIGIN = 'https://littlesheepdesign-max.github.io';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (pathname === '/api/data') {
      return proxyFPL(`${FPL_BASE}/bootstrap-static/`);
    }

    if (pathname.startsWith('/api/live/')) {
      const gw = pathname.split('/').pop();
      return proxyFPL(`${FPL_BASE}/event/${gw}/live/`);
    }

    // Health check / root
    if (pathname === '/') {
      return new Response('OK', {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

async function proxyFPL(targetUrl) {
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from FPL API' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch data', details: String(err) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      }
    );
  }
}
