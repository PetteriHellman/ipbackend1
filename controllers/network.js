const networkRouter = require('express').Router()
const Network = require('../models/network')
const auth = require('../utils/auth')

//tallennetaan verkko
networkRouter.post('/',auth, async (request, response) => {
  /*
  #swagger.tags = ['Network']
  #swagger.description = 'Make new network'
  #swagger.security = [{"bearerAuth": []}]
  */
  const body = request.body
  
  const network = new Network({
    networkName : body.networkName,
    hostMin: body.hostMin,
    hostMax: body.hostMax,
    hostNetwork: body.hostNetwork
  })
 
  const savedNetwork = await network.save()

  response.status(201).json(savedNetwork)
})

networkRouter.get('/',auth, async (request, response) => {
  /*
  #swagger.tags = ['Network']
  #swagger.description = 'Get all networks'
  #swagger.security = [{"bearerAuth": []}]
  */
  const network = await Network
    .find({})

  response.json(network)
})


module.exports = networkRouter