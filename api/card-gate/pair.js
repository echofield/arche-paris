/**
 * /api/card-gate/pair - test if this file works at all
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    status: 'pair endpoint works',
    nodeVersion: process.version,
  });
};
