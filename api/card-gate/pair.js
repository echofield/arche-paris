/**
 * Minimal test with require
 */

module.exports = function handler(req, res) {
  var https = require('https');

  return res.status(200).json({
    ok: true,
    hasHttps: !!https
  });
};
