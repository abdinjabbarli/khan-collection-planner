// LIVE verification of The Color API /scheme endpoint, including the CORS headers a browser needs.
// Usage: node scripts/verify-color-api.mjs [origin]
// Run from a machine/network that can reach www.thecolorapi.com.
const origin = process.argv[2] ?? 'https://timely-sunflower-ea28d3.netlify.app';
const url = 'https://www.thecolorapi.com/scheme?hex=0047AB&mode=analogic&count=5&format=json';
try {
  const pre = await fetch(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' } });
  console.log('OPTIONS', pre.status, 'allow-origin =', pre.headers.get('access-control-allow-origin'));
  const res = await fetch(url, { headers: { Origin: origin, Accept: 'application/json' } });
  console.log('GET', res.status, 'content-type =', res.headers.get('content-type'));
  console.log('access-control-allow-origin =', res.headers.get('access-control-allow-origin'));
  const body = await res.json();
  console.log('colors:', body.colors?.length);
  for (const c of body.colors ?? []) console.log(' ', c.hex?.value, c.name?.value);
  const cors = res.headers.get('access-control-allow-origin');
  const ok = res.ok && body.colors?.length === 5 && (cors === '*' || cors === origin);
  console.log(ok ? 'RESULT: OK (API reachable, 5 colours, CORS allows this origin)' : 'RESULT: PROBLEM');
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.log('RESULT: REQUEST FAILED:', e?.cause?.code ?? e?.message ?? e);
  process.exit(2);
}
