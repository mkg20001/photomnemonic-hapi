'use strict'

/* eslint-disable no-negated-condition */

const Hapi = require('@hapi/hapi')
const Joi = require('@hapi/joi')

/* const pino = require('pino')
const log = pino({ name: 'photomnemonic' }) */

const Relish = require('relish')({
  messages: {}
})

const puppeteer = require('puppeteer')

async function screenshot (url, fullscreen) {
  const browser = await puppeteer.launch({ args: ['--hide-scrollbars', '--window-size=1280x720'] })
  const page = await browser.newPage()
  await page.goto(url)

  await page.setViewport({
    mobile: false,
    deviceScaleFactor: 0,
    scale: 1,
    width: 1280,
    height: 0
  })

  let height = 720

  if (fullscreen) {
    height = await page.evaluate('document.body.scrollHeight')
  }

  await page.setViewport({
    mobile: false,
    deviceScaleFactor: 0,
    scale: 1,
    width: 1280,
    height: height
  })

  // Look for a global function _photomnemonicReady and if it exists, wait until it returns true.
  await page.evaluate(
    `new Promise(resolve => {
      if (window._photomnemonicReady) {
        if (window._photomnemonicReady()) {
          resolve();
        } else {
          const interval = setInterval(() => {
            if (window._photomnemonicReady()) {
              clearInterval(interval);
              resolve();
            }
          }, 250)
        }
      } else {
        resolve();
      }
    })`)

  const meta = await page.evaluate('window._photomnemonicGetMeta ? window._photomnemonicGetMeta() : null')

  await page.setViewport({
    width: meta && meta.width ? meta.width : 1280,
    height: meta && meta.height ? meta.height : height
  })

  const screenshot = await page.screenshot({ type: 'png' })

  await browser.close()

  return {
    meta,
    data: screenshot.toString('hex')
  }
}

const init = async config => {
  config.hapi.routes = {
    validate: {
      failAction: Relish.failAction
    }
  }

  config.hapi.cache = {
    name: 'memory',
    provider: {
      constructor: require('@hapi/catbox-memory'),
      options: { partition: 'photomnemonic' }
    }
  }

  const server = Hapi.server(config.hapi)

  await server.register({
    plugin: require('hapi-pino'),
    options: { name: 'photomnemonic' }
  })

  if (global.SENTRY) {
    await server.register({
      plugin: require('hapi-sentry'),
      options: { client: global.SENTRY }
    })
  }

  await server.register({
    plugin: require('@hapi/inert')
  })

  server.method('screenshot', screenshot, {
    cache: {
      expiresIn: 60 * 60 * 1000,
      generateTimeout: 10 * 1000
    }
  })

  // main logic

  server.route({
    method: 'GET',
    path: '/',
    config: {
      handler: async (req, h) => {
        const {
          url,
          fullscreen
        } = req.query

        const result = await server.methods.screenshot(url, fullscreen)

        const res = h.response(Buffer.from(result.data, 'hex')).header('Content-Type', 'image/png')

        return result.meta ? res.header('X-Photomnemonic-Meta', JSON.stringify(result.meta)) : res
      },
      validate: {
        query: Joi.object({
          url: Joi.string().uri().default('https://google.com'),
          fullscreen: Joi.boolean().default(false)
        }).options({ stripUnknown: true })
      }
    }
  })

  async function stop () {
    await server.stop()
  }

  await server.start()

  process.on('SIGINT', () => {
    stop()
  })

  process.on('SIGTERM', () => {
    stop()
  })
}

module.exports = init
