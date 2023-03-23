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

adminpassRouter.post('/:id', auth, async (req, res) => {
  /*
  #swagger.tags = ['Admin']
  #swagger.summary = 'Endpoint for change anyone passwords.'
  #swagger.description = 'Endpoint for change anyone passwords.'
  #swagger.security = [{"bearerAuth": []}]
  */
  const token = getTokenFrom(req)
  let decodedToken

  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (error) {
    return res.status(401).json({ error: 'token invalid' })
  }
  if (decodedToken.role !== 'admin') {
    return res.status(401).json({ error: 'unauthorized' })
  }
  if (!decodedToken.id) {
    return res.status(401).json({ error: 'token invalid' })
  }

  const userId = req.params.id
  const newPassword = req.body.newPassword

  try {
    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    const updatedUser = await User.findOneAndUpdate({ _id: userId }, { passwordHash: hashedPassword }, { new: true })
    res.send(updatedUser)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

module.exports = adminpassRouter