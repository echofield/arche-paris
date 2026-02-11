/**
 * Test: actual https request to Supabase
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  var https = require('https');
  var projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
  var anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!projectId) {
    return res.status(500).json({ error: 'Missing projectId' });
  }

  var bodyStr = req.body ? JSON.stringify(req.body) : '{}';

  var options = {
    hostname: projectId + '.supabase.co',
    port: 443,
    path: '/functions/v1/card-gate/pair',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + anonKey,
      'Content-Length': Buffer.byteLength(bodyStr)
    }
  };

  var proxyReq = https.request(options, function(proxyRes) {
    var chunks = [];
    proxyRes.on('data', function(c) { chunks.push(c); });
    proxyRes.on('end', function() {
      var body = Buffer.concat(chunks).toString();
      res.status(proxyRes.statusCode).send(body);
    });
  });

  proxyReq.on('error', function(e) {
    res.status(500).json({ error: e.message });
  });

  proxyReq.write(bodyStr);
  proxyReq.end();
};
