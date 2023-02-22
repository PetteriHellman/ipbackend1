const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

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
  ips: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IPs'
    }
  ],
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const User = mongoose.model('User', userSchema)
module.exports = User