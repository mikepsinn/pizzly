// app.js
import * as path from "path";
const settings = require("../settings.js");


if(!process.env.DATABASE_URL) {
  const secrets = JSON.parse(
      require('child_process').execSync('node ../doppler-secrets.js')
  )
  for(const key in secrets) {
    let secret = secrets[key];
    if(typeof secret !== 'undefined' && secret !== null) {
      process.env[key] = secret
    }
  }
}
import express from 'express'
import telemetry from './lib/telemetry'
import * as routes from './routes'
// doppler-secrets.js

export const BUID = 'bearerUid' // TODO - What is this for?
export const PORT = process.env.PORT || 8080

const app = express()

app.set('view engine', 'ejs')
let viewPath = '/views';

function absPath(filePath) {
  return path.join(settings.PROJECT_DIR, filePath);
}

let viewDir = absPath(viewPath)
app.set('views', viewDir)
app.set('trust proxy', 1)

/**
 * Force HSTS
 */

app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})

/**
 * Log request
 */

app.use((req, _res, next) => {
  console.log(req.method, req.path)
  next()
})

/**
 * Assets
 */

app.use('/assets', express.static(absPath('./views/assets')))

/**
 * Pizzly's homepage
 */

app.get('/', routes.home)

/**
 * API endpoints
 */

app.use('/api', routes.api)

/**
 * Authentication endpoints
 */

app.use('/auth', routes.auth)

/**
 * Dashboard
 */

app.use('/dashboard', routes.dashboard)

/**
 * Proxy feature
 */

app.use('/proxy', routes.proxy)

/**
 * Legacy endpoints
 *
 * Pizzly is a fork of a previous codebase made by Bearer.sh engineering team.
 * To help the migration of Bearer's users, we keep here some legacy endpoints.
 * It's very likely that these endpoints will be removed by the end of 2020,
 * so please do not rely on these endpoints anymore.
 */

app.use('/v2/auth', routes.legacy.auth)
app.use('/apis', routes.legacy.apis)
app.use('/api/v4/functions', routes.legacy.proxy)

/**
 * Error handling
 */

app.use((_req, res, _next) => {
  res.status(404).render('errors/404')
})

app.use((err, _req, res, _next) => {
  console.error(err)

  const status = err.status && Number(err.status)

  if (status && status >= 400 && status < 500) {
    res.status(status).render('errors/' + err.status)
  } else {
    res.status(500).render('errors/500')
  }
})

/**
 * Starting up the server
 */

app.listen(PORT, async () => {
  // Log start up
  console.log('Pizzly listening on port', PORT)
  if (PORT === 8080) {
    console.log('http://localhost:8080')
  }

  // Initialize Telemetry (if enabled)
  process.env.UUID = telemetry()
})