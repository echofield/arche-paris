/**
 * /api/card-gate/pair - proxy to Supabase using https module
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  var projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
  var anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!projectId) {
    return res.status(500).json({ error: 'SUPABASE_PROJECT_ID not set' });
  }

  // Use https module (works in all Node.js)
  var https = require('https');
  var body = req.method !== 'GET' && req.body ? JSON.stringify(req.body) : null;

  var options = {
    hostname: projectId + '.supabase.co',
    port: 443,
    path: '/functions/v1/card-gate/pair',
    method: req.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization || ('Bearer ' + anonKey)
    }
  };
  if (req.headers.cookie) {
    options.headers['Cookie'] = req.headers.cookie;
  }
  if (body) {
    options.headers['Content-Length'] = Buffer.byteLength(body);
  }

  var proxyReq = https.request(options, function(proxyRes) {
    var data = '';
    proxyRes.on('data', function(chunk) { data += chunk; });
    proxyRes.on('end', function() {
      var setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        res.setHeader('Set-Cookie', setCookie);
      }
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
      res.status(proxyRes.statusCode || 500).send(data);
    });
  });

  proxyReq.on('error', function(err) {
    res.status(500).json({ error: err.message });
  });

  if (body) {
    proxyReq.write(body);
  }
  proxyReq.end();
};
