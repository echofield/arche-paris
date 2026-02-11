/**
 * Proxy using Promise wrapper
 */

function makeRequest(options, body) {
  return new Promise(function(resolve, reject) {
    var https = require('https');
    var req = https.request(options, function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
        resolve({ status: res.statusCode, body: d, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  return makeRequest({
    hostname: 'qvyrpzgxsppkwfvqvgcn.supabase.co',
    port: 443,
    path: '/functions/v1/card-gate/pair',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, '{}').then(function(result) {
    res.status(result.status).send(result.body);
  }).catch(function(err) {
    res.status(500).json({ err: err.message });
  });
};
