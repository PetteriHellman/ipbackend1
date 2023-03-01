const ipsRouter = require('express').Router()

const IPs = require('../models/ip')
const User = require('../models/user')
const Network = require('../models/network')

const jwt = require('jsonwebtoken')

const ipblocks = require('ip-blocks')
const ip = require('ip')


const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

//haetaan kaikki IP-osoitteet
ipsRouter.get('/', async (request, response) => {
  const ips = await IPs.find({})
  //  .find({}).populate('user', { email: 1, name: 1 })

  response.json(ips)
})

//tallennetaan ip osoite
ipsRouter.post('/', async (request, response) => {
  const body = request.body
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const ip = new IPs({
    ip: body.ip,
    desc: body.desc,
    user: user._id,
  })
 
  const savedIP = await ip.save()

  user.ips = user.ips.concat(savedIP._id)
  await user.save()

  response.status(201).json(savedIP)
})

const randomIP = (hostMin, hostMax, network) => {
  const countIP = ip.toLong(hostMax) - ip.toLong(hostMin)
  console.log('count',countIP)
  
  //Arvotaan IP-osoite annetuilla parametreilla
  const ipArray = ipblocks(hostMin, network, Math.floor(Math.random() * countIP))

  //Tehdään pisteillä erotettu stringi ipblocks:n palauttamasta arraysta
  const ipString = ipArray.join('.')
  
  //Palautetaan stringinä oleva ip osoite
  return ipString
}

const getNextIp = (networkId) => {
  return Network.findById(networkId)
    .then(network => {
      if (!network) {
        throw new Error('Network not found')
      }

      const ipAddress = randomIP(network.hostMin, network.hostMax, network.hostNetwork)

      return IPs.findOne({ ip: ipAddress }).limit(1)
        .then(existingIp => {
          if (existingIp) {
            //Jos kannasta löytyy jo kyseinen osoite ajetaan sama funktio uudelleen
            return getNextIp()
          } else {
            //Jos kannasta ei löydy kyseistä osoistetta palautetaan se
            return ipAddress
          }
        })
    })
}

//Tarjotaan uutta satunnaisesti generoitua IP-osoitetta
ipsRouter.post('/next-ip', async (request, response, next) => {
  const body = request.body
  
  //Tarkistetaan kirjautuminen
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  //Otetaan kirjautuneen käyttäjän tiedot talteen
  const user = await User.findById(decodedToken.id)

  //Kutsutaan getNextIp funktiota
  getNextIp(body.networkId)
    .then(async ipAddress => {

      const ip = new IPs({
        desc: body.desc,
        ip: ipAddress,
        user: user._id,
      })

      //Varataan IP-osoite käyttöön
      const savedIP = await ip.save()

      user.ips = user.ips.concat(savedIP._id)
      await user.save()
      //Palautetaan varattu IP-osoite
      response.status(201).json({message: 'Uusi IP-osoite luotu', savedIP})
    })
    .catch(error => {
      response.status(500).json({ message: 'Internal server error' })
      next(error)
    })
})

//Haetaan yksittäinen IP-osoite
ipsRouter.get('/:id', async (request, response) => {
  const ip = await IPs.findById(request.params.id)
  if (ip) {
    response.json(ip)
  } else {
    response.status(404).end()
  }
})

//Poistetaan IP-osoite
ipsRouter.delete('/:id', async (request, response) => {
  await IPs.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

//Muokataan IP-osoitetta ja/tai kuvausta
ipsRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const ip = {
    ip: body.ip,
    desc: body.desc,
  }

  IPs.findByIdAndUpdate(request.params.id, ip, { new: true })
    .then(updatedIP => {
      response.json(updatedIP)
    })
    .catch(error => next(error))
})

module.exports = ipsRouter