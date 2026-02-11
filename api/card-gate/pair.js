/**
 * /api/card-gate/pair - proxy with Promise
 */

module.exports = function handler(req, res) {
  return new Promise(function(resolve, reject) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return resolve();
    }

    var https = require('https');
    var projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
    var anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!projectId) {
      res.status(500).json({ error: 'Missing projectId' });
      return resolve();
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
        resolve();
      });
    });

    proxyReq.on('error', function(e) {
      res.status(500).json({ error: e.message });
      resolve();
    });

    proxyReq.write(bodyStr);
    proxyReq.end();
  });
};
