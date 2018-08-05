module.exports = {
  "globDirectory": "./dist/",
  // Pre-cache starts
  "globPatterns": [
    "**/*.html",
    "**/*.js",
    "**/*.png",
    "**/*.css",
  ],
  // Pre-cache ends
  "swSrc": "./sw.js",
  "swDest": "./dist/sw.js"
};