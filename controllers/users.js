const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const IPs = require('../models/ip')
const auth = require('../utils/auth')

usersRouter.post('/', async (request, response) => {
  /*
  #swagger.tags = ['User']
  #swagger.description = 'Create new user'
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

usersRouter.get('/',auth, async (request, response) => {
  /*
  #swagger.tags = ['Admin']
  #swagger.description = 'Get all users'
  */
  if (request.decodedToken.role == 'admin'){
    const users = await User
      .find({}).populate('ips', { ip: 1, desc: 1, expirationDate: 1, createdAt: 1 })
    response.json(users)
  }
  else {
    response.status(404).end()
  }
})

usersRouter.get('/user',auth, async (request, response) => {
  /*
  #swagger.tags = ['User']
  #swagger.description = 'Get user'
  */
  const user = await User.findById(request.decodedToken.id).populate('ips', { ip: 1, desc: 1, expirationDate: 1, createdAt: 1 })
  if (user) {
    response.json(user)
  } else {
    response.status(404).end()
  }
})

//Poistetaan käyttäjä
usersRouter.delete('/:id',auth, async (request, response) => {
  /*
  #swagger.tags = ['Admin']
  #swagger.description = 'Delete user and ip addresses belong to it'
  */
  const decodedToken = request.decodedToken
  if (decodedToken.role !== 'admin') {
    return response.status(401).json({ error: 'unauthorized' })
  }
  const userId = request.params.id
  //poistetaan IP-taulusta kyseisen käyttäjän kaikki IP:t
  await IPs.deleteMany({user: userId})
  
  //poistetaan itse käyttäjä
  await User.findByIdAndRemove(userId)
  response.status(204).end()
})

module.exports = usersRouter