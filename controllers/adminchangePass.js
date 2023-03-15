const express = require('express')
const adminpassRouter = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

const jwt = require('jsonwebtoken')
const auth = require('../utils/auth')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

adminpassRouter.post('/:id', auth, async (request, response, next) => {
  const token = getTokenFrom(request)
  let decodedToken

  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (error) {
    return response.status(401).json({ error: 'token invalid' })
  }

  if (!decodedToken.id || decodedToken.role !== 'admin') {
    return response.status(401).json({ error: 'unauthorized' })
  }

  const { id } = request.params
  const { newPassword } = request.body
  
  try {
    const user = await User.findOne({_id: id})
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

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

module.exports = adminpassRouter