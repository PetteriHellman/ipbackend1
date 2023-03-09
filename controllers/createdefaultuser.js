const bcrypt = require('bcrypt')
const config = require('../utils/config')
const logger = require('../utils/logger')

const readline = require('node:readline/promises')
const chalk = require('chalk')

const mongoose = require('mongoose')

const User = require('../models/user')
const IPs = require('../models/ip')
const Network = require('../models/network')

mongoose.set('strictQuery', true)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const util = require('util'),
  question = util.promisify(rl.question),
  prompt = chalk.bold.magenta,
  info = {}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI)
    logger.info('connected to MongoDB')
  } catch (error) {
    logger.error('error connecting to MongoDB:', error.message)
  }
  const numUsers = await User.countDocuments()
  const numNetworks = await Network.countDocuments()
  console.log('numNetworks', numNetworks)
  if (numUsers > 0 || numNetworks > 0) {
    logger.error('There are already users in the database, skipping admin user creation')
    if (numNetworks > 0) {
      logger.error('There are already network in the database, skipping network creation')
    }
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
  async function main() {
    try {
    info.admin = await question(prompt('Enter admin email: '))
    info.name = await question(prompt('Enter admin name: '))
    info.password = await question(prompt('Enter admin password: '))
    await createDefaultUser(info.email, info.name, info.password)
    /*  if (numNetworks > 0) {
       info.networkName = await question(prompt('Enter network name for randomip pool: '))
       info.hostMin = await question(prompt('Enter hostmin ip-address for randomip pool: '))
       info.hostMax = await question(prompt('Enter hostmax ip-address for randomip pool: '))
       info.hostNetwork = await question(prompt('Enter network without / mark (example 22 or 24) for randomip pool: '))
       await createDefaultNetwork(info.networkName, info.hostMin, info.hostMax, info.hostNetwork)
     } */

    rl.close()
    }
    catch (err) {
      console.error('Question rejected', err);
    }
  }
  main()
  await mongoose.disconnect()

  // rl.question('Enter admin email: ', async (email) => {
  //   await rl.question('Enter admin name: ', async (name) => {
  //     await rl.question('Enter admin password: ', async (password) => {
  //       await createDefaultUser(email, name, password)
  //       if (numNetworks < 0) {
  //       rl.close()
  //       }
  //       await mongoose.disconnect()
  //     })
  //   })
  // })
  // if (numNetworks == 0) {
  //   console.log('test')
  //   if (mongoose.connection.readyState == 0) {
  //     await mongoose.connect(config.MONGODB_URI)
  //     logger.info('connected to MongoDB')
  //   }
  //   rl.question('Enter network name for randomip pool: ', async (networkName) => {
  //     await rl.question('Enter hostmin ip-address for randomip pool: ', async (hostMin) => {
  //       await rl.question('Enter hostmax ip-address for randomip pool: ', async (hostMax) => {
  //         await rl.question('Enter network without / mark (example 22 or 24) for randomip pool: ', async (hostNetwork) => {
  //           await createDefaultNetwork(networkName, hostMin, hostMax, hostNetwork)
  //           rl.close()
  //           await mongoose.disconnect()
  //         })
  //       })
  //     })
  //   })
  // }


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

const createDefaultNetwork = async (networkName, hostMin, hostMax, hostNetwork) => {
  try {
    const newNetwork = new Network({
      networkName,
      hostMin,
      hostMax,
      hostNetwork
    })

    await newNetwork.save()
    logger.info('Network created successfully')
  } catch (error) {
    logger.error('Error creating netwrok:', error.message)

  }
}

connectToDatabase()