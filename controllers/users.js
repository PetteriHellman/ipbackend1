const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const IPs = require('../models/ip')
const adminAuth = require('../utils/adminAuth')

usersRouter.post('/', async (request, response) => {
  const { email, name, password } = request.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)

})

usersRouter.get('/',adminAuth, async (request, response) => {
  const users = await User
    .find({}).populate('ips', { ip: 1, desc: 1, expirationDate: 1, createdAt: 1 })
  response.json(users)
})

//Poistetaan käyttäjä
usersRouter.delete('/:id',adminAuth, async (request, response) => {
  const userId = request.params.id
  //poistetaan IP-taulusta kyseisen käyttäjän kaikki IP:t
  await IPs.deleteMany({user: userId})
  
  //poistetaan itse käyttäjä
  await User.findByIdAndRemove(userId)
  response.status(204).end()
})

module.exports = usersRouter