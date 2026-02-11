/**
 * Test: does https.request cause boot error?
 */

module.exports = function handler(req, res) {
  var https = require('https');

  // Just test if we can call https.request without error
  var options = {
    hostname: 'example.com',
    port: 443,
    path: '/',
    method: 'GET'
  };

  // Create request but immediately abort it
  var testReq = https.request(options);
  testReq.on('error', function() {});
  testReq.abort();

  return res.status(200).json({
    ok: true,
    message: 'https.request works'
  });
};
