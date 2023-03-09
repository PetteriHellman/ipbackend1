const bcrypt = require('bcrypt')
const config = require('../utils/config')
const logger = require('../utils/logger')
const readline = require('readline')
const mongoose = require('mongoose')

const User = require('../models/user')
const IPs = require('../models/ip')
const Network = require('../models/network')

mongoose.set('strictQuery', true)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI)
    logger.info('connected to MongoDB')
    const numUsers = await User.countDocuments()
    if (numUsers > 0) {
      logger.error('There are already users in the database, skipping admin user creation')
      await mongoose.disconnect()
      process.exit()
    }
    //Luodaan User mallin mukainen collection
    await User.createCollection()
      .then(collection => {
        logger.info('User collection is created!')
      })
    //Luodaan IPs mallin mukainen collection
    await IPs.createCollection()
      .then(collection => {
        logger.info('IPs collection is created!')
      })
    //Luodaan Network mallin mukainen collection
    await Network.createCollection()
      .then(collection => {
        logger.info('Network collection is created!')
      })

    rl.question('Enter admin email: ', async (email) => {
      await rl.question('Enter admin name: ', async (name) => {
        await rl.question('Enter admin password: ', async (password) => {
          await createDefaultUser(email, name, password)
          rl.close()
          await mongoose.disconnect()
        })
      })
    })
  } catch (error) {
    logger.error('error connecting to MongoDB:', error.message)
  }
}

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

connectToDatabase()