/**
 * Proxy - all code inside handler
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  var https = require('https');

  return new Promise(function(resolve, reject) {
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
        resolve();
      });
    });

    proxyReq.on('error', function(e) {
      res.status(500).json({ err: e.message });
      resolve();
    });

    proxyReq.write('{}');
    proxyReq.end();
  });
};
