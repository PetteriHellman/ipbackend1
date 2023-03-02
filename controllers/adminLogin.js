const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const adminloginRouter = require('express').Router()
const User = require('../models/user')
const adminAuth = require('../utils/adminAuth')

adminloginRouter.post('/', adminAuth, async (request, response) => {
  const { email, password, role } = request.body

  const user = await User.findOne({ email })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }

  const adminForToken = {
    email: user.email,
    id: user._id,
    role: user.role
  }
  //expiration of token in an hour
  const token = jwt.sign(adminForToken, process.env.ADMIN_SECRET,
    { expiresIn: 60*60 })

  response
    .status(200)
    .send({ token, email: user.email, name: user.name })
})

module.exports = adminloginRouter