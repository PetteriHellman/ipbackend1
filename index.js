require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json())

const morgan = require('morgan')

const cors = require('cors')
app.use(cors())

const User = require('./models/database')

//const mongoose = require('mongoose')

app.use(morgan('tiny'))
app.use(express.static('build'))

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/', (request, response) => {
  response.send('<h1>Hello world</h1>')
})

//Haetaan kaikki
app.get('/api/iptable', (request, response) => {
  User.find({}).then(users => {
    response.json(users)
  })
})

//Haetaan yksittäinen
app.get('/api/iptable/:id', (request, response, next) => {
  User.findById(request.params.id)
    .then(user => {
      if (user) {
        response.json(user)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

//Poistetaan
app.delete('/api/iptable/:id', (request, response, next) => {
  User.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

//Lähetään
app.post('/api/iptable', (request, response, next) => {
  const body = request.body
  const user = new User({
    user: body.user,
  })

  user.save().then(savedUser => {
    response.json(savedUser)
  })
    .catch(error => next(error))
})

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })

  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
//const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})