const mongoose = require('mongoose')

const networkSchema = new mongoose.Schema({
  networkName: {
    type: String,
    required: true,
  },
  hostMin: {
    type: String,
    required: true,
    match: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
  },
  hostMax: {
    type: String,
    required: true,
    match: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
  },
  hostNetwork: {
    type: Number,
    required: true,
  }
})

networkSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Network = mongoose.model('network', networkSchema)
module.exports = Network