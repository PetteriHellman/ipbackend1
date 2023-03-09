// const bcrypt = require('bcrypt')
// const adminCreateRouter = require('express').Router()
// const User = require('../models/user')
// const auth = require('../utils/auth')

// // Create a new user with token authentication
// adminCreateRouter.post('/', auth, async (request, response) => {
//   const { email, name, password, role } = request.body

//   const saltRounds = 10
//   const passwordHash = await bcrypt.hash(password, saltRounds)

//   const user = new User({
//     email,
//     name,
//     passwordHash,
//     role
//   })

//   const savedUser = await user.save()

//   response.status(201).json(savedUser)
// })

// // Get all users with token authentication
// adminCreateRouter.get('/', auth, async (request, response) => {
//   const users = await User
//     .find({}).populate('ips', { ip: 1, desc: 1 })
//   response.json(users)
// })

// module.exports = adminCreateRouter