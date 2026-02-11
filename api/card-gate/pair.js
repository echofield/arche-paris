/**
 * Proxy with require inside handler
 */

module.exports = function handler(req, res) {
  var https = require('https');

  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  var options = {
    hostname: 'qvyrpzgxsppkwfvqvgcn.supabase.co',
    port: 443,
    path: '/functions/v1/card-gate/pair',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  var proxyReq = https.request(options, function(proxyRes) {
    var d = '';
    proxyRes.on('data', function(c) { d += c; });
    proxyRes.on('end', function() {
      res.status(proxyRes.statusCode).send(d);
    });
  });

  proxyReq.on('error', function(e) {
    res.status(500).json({ error: e.message });
  });

  proxyReq.write('{}');
  proxyReq.end();
};
