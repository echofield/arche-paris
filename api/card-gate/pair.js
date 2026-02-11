/**
 * Test: with both abort flag and write/end
 */

module.exports = function handler(req, res) {
  var https = require('https');
  var doAbort = false; // flag to control

  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  var proxyReq = https.request({
    hostname: 'qvyrpzgxsppkwfvqvgcn.supabase.co',
    port: 443,
    path: '/functions/v1/card-gate/pair',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, function(proxyRes) {
    var d = '';
    proxyRes.on('data', function(c) { d += c; });
    proxyRes.on('end', function() {
      res.status(proxyRes.statusCode).send(d);
    });
  });

  proxyReq.on('error', function(e) {
    res.status(500).json({ err: e.message });
  });

  if (doAbort) {
    proxyReq.abort();
    return res.status(200).json({ aborted: true });
  }

  proxyReq.write('{}');
  proxyReq.end();
};
