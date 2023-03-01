const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const adminCreateRouter = require('express').Router()
const User = require('../models/user')
const adminAuth = require('../utils/adminAuth')

// Create a new user with token authentication
  adminCreateRouter.post('/', adminAuth, async (request, response) => {
    const { email, name, password, role } = request.body
  
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
  
    const user = new User({
      email,
      name,
      passwordHash,
      role
    })
  
    const savedUser = await user.save()
  
    response.status(201).json(savedUser)
  })
  
  // Get all users with token authentication
  adminCreateRouter.get('/', adminAuth, async (request, response) => {
    const users = await User
      .find({}).populate('ips', { ip: 1, desc: 1 })
    response.json(users)
  })
  
  module.exports = adminCreateRouter