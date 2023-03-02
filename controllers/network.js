const networkRouter = require('express').Router()
const Network = require('../models/network')

//tallennetaan verkko
networkRouter.post('/', async (request, response) => {
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

networkRouter.get('/', async (request, response) => {
  const network = await Network
    .find({})

  response.json(network)
})


module.exports = networkRouter