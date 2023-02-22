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
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
})
ipSchema.plugin(uniqueValidator)

ipSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

// set the timeout to 24 hours (in milliseconds)
//const timeTillDelete = 24 * 60 * 60 * 1000
const timeTillDelete = 60 * 1000
ipSchema.pre('remove', function (next) {
  // calculate the time till delete
  const timeDiff = timeTillDelete - (Date.now() - this.created_at.getTime())
  // if there's still time, set a timeout to delete the document
  if (timeDiff > 0) {
    setTimeout(() => {
      this.remove()
    }, timeDiff)
  }
  // if there's no time left, proceed with removing the document
  else {
    next()
  }
})

const IPs = mongoose.model('IPs', ipSchema)
module.exports = IPs
