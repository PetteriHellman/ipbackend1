const express = require('express')
const passRouter = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

const jwt = require('jsonwebtoken')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

passRouter.post('/', async (request, response, next) => {
  /*
  #swagger.tags = ['User']
  #swagger.summary = 'Endpoint for change user passwords.'
  #swagger.description = 'Endpoint for change user passwords.'
  #swagger.security = [{"bearerAuth": []}]
  */
  // Tarkistetaan kirjautuminen
  const token = getTokenFrom(request)
  let decodedToken

  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (error) {
    return response.status(401).json({ error: 'token invalid' })
  }

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const { oldPassword, newPassword } = request.body
  try {
    //Otetaan kirjautuneen käyttäjän tiedot talteen
    const user = await User.findById(decodedToken.id)
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isMatch) {
      return response.status(401).json({ error: 'Invalid password' })

    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    user.passwordHash = hashedPassword
    await user.save()

    response.status(200).json({ message: 'Password updated successfully' })

  } catch (error) {
    next(error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = passRouter