const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

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
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1h'
  },
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
})

ipSchema.plugin(uniqueValidator)

ipSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const IPs = mongoose.model('IPs', ipSchema)
module.exports = IPs
