const bcrypt = require('bcrypt')
const config = require('../utils/config')
const logger = require('../utils/logger')
const readline = require('readline')
const mongoose = require('mongoose')
const User = require('../models/user')

mongoose.set('strictQuery', true);

  mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });  

// create a new admin user with the given email, name and password
const createDefaultUser = async (email, name, passwordHash) => {
  try {
    const saltRounds = 10
    const hash = await bcrypt.hash(passwordHash, saltRounds)

    const newUser = new User({
      email,
      name,
      passwordHash: hash,
      role: 'admin'
    })

    await newUser.save()
    logger.info('Admin user created successfully')
  } catch (error) {
    logger.error('Error creating admin user:', error.message)
  }
}

  // Ask the user for input and create a new admin user
  rl.question('Enter admin email: ', (email) => {
    rl.question('Enter admin name: ', (name) => {
      rl.question('Enter admin password: ', async (password) => {
        await createDefaultUser(email, name, password)
        rl.close()
        await mongoose.disconnect()
      })
    })
  })