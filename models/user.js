const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 5,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
  },
  passwordHash: {
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
userSchema.plugin(uniqueValidator)
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)
module.exports = User