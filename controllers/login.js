const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
  /*
    #swagger.tags = ['Login']
    #swagger.summary = 'Endpoint to sign in a specific user.'
    #swagger.description = 'Endpoint to sign in a specific user.'
  */
  const { email, password } = request.body

  const user = await User.findOne({ email })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    email: user.email,
    id: user._id,
    role: user.role
  }
  //expiration of token in an hour
  const token = jwt.sign(userForToken, process.env.SECRET,
    { expiresIn: 60*60 })

  response
    .status(200)
    .send({ token, email: user.email, name: user.name })
})

module.exports = loginRouter