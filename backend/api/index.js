// Vercel serverless entry — serves the Express app as a function.
// All requests are routed here via vercel.json rewrites.
module.exports = require('../src/app');
