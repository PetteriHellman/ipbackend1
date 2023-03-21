const networkRouter = require('express').Router()
const Network = require('../models/network')
const auth = require('../utils/auth')

//tallennetaan verkko
networkRouter.post('/',auth, async (request, response) => {
  /*
  #swagger.tags = ['Network']
  #swagger.summary = 'Make new network'
  #swagger.description = 'Make new network'
  #swagger.security = [{"bearerAuth": []}]
  */
  const body = request.body
  
  const network = new Network({
    networkName : body.networkName,
    hostMin: body.hostMin,
    hostMax: body.hostMax,
    hostNetwork: body.hostNetwork,
    networkActive: body.networkActive
  })
 
  const savedNetwork = await network.save()

  response.status(201).json(savedNetwork)
})

networkRouter.get('/',auth, async (request, response) => {
  /*
  #swagger.tags = ['Network']
  #swagger.summary = 'Get all networks'
  #swagger.description = 'Get all networks'
  #swagger.security = [{"bearerAuth": []}]
  */
  const network = await Network
    .find({})

  response.json(network)
})

//update networkActive
networkRouter.put('/:id', auth, async (request, response) => {
  const { id } = request.params
  const { networkActive } = request.body

  try {
    if (networkActive === true) {
      // Deactivate all other networks
      await Network.updateMany({ _id: { $ne: id } }, { networkActive: false })
    }

    const network = await Network.findByIdAndUpdate(
      id,
      { networkActive },
      { new: true } // return the updated document
    )
    response.json(network)
  } catch (error) {
    response.status(400).json({ error: 'Invalid network id' })
  }
})


module.exports = networkRouter