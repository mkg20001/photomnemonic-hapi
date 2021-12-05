#!/usr/bin/env node

'use strict'

const Joi = require('joi')

require('mkg-bin-gen')(
  'photomnemonic',
  {
    validator: Joi.object({
      hapi: Joi.object({
        host: Joi.string().default('::'),
        port: Joi.number().integer().default(35331)
      }).pattern(/./, Joi.any()).required()
    })
  },
  require('.')
)
