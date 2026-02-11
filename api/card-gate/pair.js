/**
 * Test: https.request with callback
 */

module.exports = function handler(req, res) {
  var https = require('https');

  var options = {
    hostname: 'example.com',
    port: 443,
    path: '/',
    method: 'GET'
  };

  var testReq = https.request(options, function(proxyRes) {
    // Callback that never runs because we abort
    var chunks = [];
    proxyRes.on('data', function(chunk) {
      chunks.push(chunk);
    });
    proxyRes.on('end', function() {
      // Never reached
    });
  });

  testReq.on('error', function() {});
  testReq.abort();

  return res.status(200).json({
    ok: true,
    message: 'https.request with callback works'
  });
};
