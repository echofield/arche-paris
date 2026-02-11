/**
 * /api/card-gate/refresh - proxy to Supabase
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

  var https = require('https');
  var bodyStr = null;
  if (req.method !== 'GET' && req.body) {
    bodyStr = JSON.stringify(req.body);
  }

  var reqHeaders = {
    'Content-Type': 'application/json',
    'Authorization': req.headers.authorization || ('Bearer ' + anonKey)
  };
  if (req.headers.cookie) {
    reqHeaders['Cookie'] = req.headers.cookie;
  }
  if (bodyStr) {
    reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
  }

  var options = {
    hostname: projectId + '.supabase.co',
    port: 443,
    path: '/functions/v1/card-gate/refresh',
    method: req.method || 'POST',
    headers: reqHeaders
  };

  var proxyReq = https.request(options, function(proxyRes) {
    var chunks = [];
    proxyRes.on('data', function(chunk) {
      chunks.push(chunk);
    });
    proxyRes.on('end', function() {
      var data = Buffer.concat(chunks).toString();
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

  if (bodyStr) {
    proxyReq.write(bodyStr);
  }
  proxyReq.end();
};
