const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const IPs = require('../models/ip')
const auth = require('../utils/auth')

usersRouter.post('/', async (request, response) => {
  /*
  #swagger.tags = ['Register']
  #swagger.summary = 'Endpoint for create a new user'
  #swagger.description = 'Endpoint for create a new user'
  #swagger.parameters['email','name','password','group'] = {
        in: 'body',
        required: {
          $email: 'true',
          $name: 'true',
          $password: 'true'

        },
        description: {
          $email: 'Email for user',
          $name: 'Name for user',
          $password: 'Password for user',
          $group: 'Group for user'
        },
        type: 'string',
        schema: {
          $email: 'joh.doe@email.com',
          $name: 'John Doe',
          $password: '12345678',
        }
  }
  */
  const { email, name, password, group } = request.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email,
    name,
    group,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)

})

usersRouter.get('/', auth, async (request, response) => {
  /*
  #swagger.tags = ['Admin']
  #swagger.summary = 'Endpoint for get all users'
  #swagger.description = 'Endpoint for get all users'
  #swagger.security = [{"bearerAuth": []}]
  */
  if (request.decodedToken.role == 'admin') {
    const users = await User.find({})
    response.json(users)
  }
  else {
    response.status(404).end()
  }
})

usersRouter.get('/:userId', auth, async (request, response) => {
  /*
  #swagger.tags = ['User']
  #swagger.summary = 'Endpoint for get user'
  #swagger.description = 'Endpoint for get user'
  #swagger.security = [{"bearerAuth": []}]
  */
  const decodedToken = request.decodedToken
  if (request.params.userId === decodedToken.id || decodedToken.role === 'admin') {
    const ips = await User.findById(request.params.userId)
    if (ips) {
      response.json(ips)
    } else {
      response.status(404).end()
    }
  } else response.status(401).end()
})

//Poistetaan käyttäjä
usersRouter.delete('/:userId',auth, async (request, response) => {
  /*
  #swagger.tags = ['Admin']
  #swagger.summary = 'Endpoint for delete user and ip addresses belong to it'
  #swagger.description = 'Endpoint for delete user and ip addresses belong to it'
  #swagger.security = [{"bearerAuth": []}]
  */
  const decodedToken = request.decodedToken
  if (decodedToken.role !== 'admin') {
    return response.status(401).json({ error: 'unauthorized' })
  }
  const userId = request.params.userId
  //poistetaan IP-taulusta kyseisen käyttäjän kaikki IP:t
  await IPs.deleteMany({user: userId})
  
  //poistetaan itse käyttäjä
  await User.findByIdAndRemove(userId)
  response.status(204).end()
})

usersRouter.put('/:userId/role', auth, async (request, response) => {
  /*
  #swagger.tags = ['Admin']
  #swagger.summary = 'Endpoint for change role'
  #swagger.description = 'Endpoint for change role'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['role'] = {
    in: 'body',
    description: {
      $role: 'Admin or user role'
      },
      type: {
        $role: 'string',
      },
      schema: {
        '$ref': '#/definitions/role'
      }
  }
  */

  const decodedToken = request.decodedToken
  if (decodedToken.role !== 'admin') {
    return response.status(401).json({ error: 'unauthorized' })
  }
  const userId = request.params.userId
  const { role } = request.body

  if (!['user', 'admin', 'null'].includes(role)) {
    return response.status(400).json({ error: 'Invalid role' })
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true })
  if (updatedUser) {
    response.json(updatedUser)
  } else {
    response.status(404).end()
  }
})

module.exports = usersRouter