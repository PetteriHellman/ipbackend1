const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
require('express-async-errors')

const ipsRouter = require('./controllers/ips')
const usersRouter = require('./controllers/users')
const middleware = require('./utils/middleware')
const passRouter = require('./controllers/passwordChange')
const loginRouter = require('./controllers/login')
const networkRouter = require('./controllers/network')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/ips', ipsRouter)
app.use('/api/users', usersRouter)
app.use('/api/users/passwordChange', passRouter)
app.use('/api/login', loginRouter)
app.use('/api/admin/network', networkRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
