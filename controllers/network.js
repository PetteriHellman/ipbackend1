const networkRouter = require('express').Router()
const Network = require('../models/network')
const auth = require('../utils/auth')

//tallennetaan verkko
networkRouter.post('/',auth, async (request, response) => {
  /*
  #swagger.tags = ['Network']
  #swagger.summary = 'Endpoint for make a new network'
  #swagger.description = 'Endpoint for make a new network'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['networkName','hostMin','hostMax','hostNetwork','networkActive'] = {
        in: 'body',
        description: {
          $networkName: 'Name for network',
          $hostMin: 'Min IP address for range of hosted IP address',
          $hostMax: 'Max IP address for range of hosted IP address',
          $hostNetwork: 'Subnet for host network without / mark',
          $networkActive: 'True or false if this netwoork is active'
        },
        type: {
          $name: 'string',
          $hostMin: 'string',
          $hostMax: 'string',
          $hostNetwork: 'number',
          $networkActive: 'boolean'
        },
        schema: {
          $networkName: 'SomeNetwork',
          $hostMin: '192.168.0.100',
          $hostMax: '192.168.0.200',
          $hostNetwork: 24,
        }
  }
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
  #swagger.summary = 'Endpoint for get all networks'
  #swagger.description = 'Endpoint for get all networks'
  #swagger.security = [{"bearerAuth": []}]
  */
  const network = await Network
    .find({})

  response.json(network)
})

//update networkActive
networkRouter.put('/:id', auth, async (request, response) => {
  /*
  #swagger.tags = ['Network']
  #swagger.summary = 'Endpoint for make network active'
  #swagger.description = 'Endpoint for make network active'
  #swagger.security = [{"bearerAuth": []}]
  */
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