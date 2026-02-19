const handler = require('./index');

module.exports = handler;

module.exports.config = {
  api: { bodyParser: false, externalResolver: true },
};
