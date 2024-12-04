"use strict";

import express from 'express'

const app = express();

// app.use(cors()); // attach cors middleware (must be set before of most route handlers to populate appropriate headers to response context)
app.use(function (req, res, next) {
  res.set({
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  })
  next()
})
app.use('/', express.static('dist'));
app.listen(3000, () => console.log('http://localhost:3000'));