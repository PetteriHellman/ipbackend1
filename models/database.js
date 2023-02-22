const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI
//const password = process.argv[2]
//const url =
//  `mongodb+srv://admin:${password}@cluster0.chqauzf.mongodb.net/ipdatabase?retryWrites=true&w=majority`


console.log('connecting to', url)
mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const ipSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    match: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
  },
  desc: {
    type: String,
    minlength: 5,
    required: true,
  }
})

const userSchema = new mongoose.Schema({
  user: {
    type: String,
    minlength: 5,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
  },
  password: {
    type: String,
    required: true,
  },
  ips: [ipSchema]
})

ipSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

// console.log('person saved!')
// mongoose.connection.close()
ipSchema.plugin(uniqueValidator)
userSchema.plugin(uniqueValidator)
module.exports = mongoose.model('ipSchema', ipSchema)
module.exports = mongoose.model('user', userSchema)