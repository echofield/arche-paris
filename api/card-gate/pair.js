/**
 * Test: https.request that aborts
 */

module.exports = function handler(req, res) {
  var https = require('https');

  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  var proxyReq = https.request({
    hostname: 'qvyrpzgxsppkwfvqvgcn.supabase.co',
    port: 443,
    path: '/functions/v1/card-gate/pair',
    method: 'POST'
  });
  proxyReq.on('error', function() {});
  proxyReq.abort();

  return res.status(200).json({ status: 'aborted request works' });
};
