const bcrypt = require('bcrypt')
const config = require('../utils/config')
const logger = require('../utils/logger')

const readline = require('readline')
const util = require('util')
const chalk = require('chalk')

const mongoose = require('mongoose')

const User = require('../models/user')
const IPs = require('../models/ip')
const Network = require('../models/network')

mongoose.set('strictQuery', true)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = util.promisify(rl.question).bind(rl)
const prompt = chalk.bold.magenta
const info = {}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI)
    logger.info('connected to MongoDB')
  } catch (error) {
    logger.error('error connecting to MongoDB:', error.message)
  }
  const numUsers = await User.countDocuments()
  const numNetworks = await Network.countDocuments()

  if (numNetworks === 0 || numUsers === 0) {
    //Luodaan User mallin mukainen collection
    await User.createCollection()
      .then(function () {
        logger.info('User collection is created!')
      })
    //Luodaan IPs mallin mukainen collection
    await IPs.createCollection()
      .then(function () {
        logger.info('IPs collection is created!')
      })
    //Luodaan Network mallin mukainen collection
    await Network.createCollection()
      .then(function () {
        logger.info('Network collection is created!')
      })
    if (numUsers > 0) {
      logger.error('There are already user(s) in the database, skipping admin user creation')
    }
    else {
      info.email = await question(prompt('Enter admin email: '))
      info.name = await question(prompt('Enter admin name: '))
      info.password = await question(prompt('Enter admin password: '))
      await createDefaultUser(info.email, info.name, info.password)
    }
    if (numNetworks > 0) {
      logger.error('There are already network in the database, skipping network creation')
    }
    else {
      info.networkName = await question(prompt('Enter network name for randomip pool: '))
      info.hostMin = await question(prompt('Enter hostmin ip-address for randomip pool: '))
      info.hostMax = await question(prompt('Enter hostmax ip-address for randomip pool: '))
      info.hostNetwork = await question(prompt('Enter subnet without / mark (example 22 or 24) for randomip pool: '))
      await createDefaultNetwork(info.networkName, info.hostMin, info.hostMax, info.hostNetwork, true)
    }
    rl.close()
  }
  else {
    logger.error('There are already user(s) and network(s) in the database, skipping admin user and network creation')
    await mongoose.disconnect()
    process.exit()

  }
  await mongoose.disconnect()
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

const createDefaultNetwork = async (networkName, hostMin, hostMax, hostNetwork, networkActive) => {
  try {
    const newNetwork = new Network({
      networkName,
      hostMin,
      hostMax,
      hostNetwork,
      networkActive
    })

    await newNetwork.save()
    logger.info('Network created successfully')
  } catch (error) {
    logger.error('Error creating netwrok:', error.message)

  }
}

connectToDatabase()