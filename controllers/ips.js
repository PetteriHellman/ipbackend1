const ipsRouter = require('express').Router()

const IPs = require('../models/ip')
const User = require('../models/user')
const Network = require('../models/network')

const userAuth = require('../utils/userAuth')

//const jwt = require('jsonwebtoken')

const ipblocks = require('ip-blocks')
const ip = require('ip')


// const getTokenFrom = request => {
//   const authorization = request.get('authorization')
//   if (authorization && authorization.startsWith('Bearer ')) {
//     return authorization.replace('Bearer ', '')
//   }
//   return null
// }

//haetaan kaikki IP-osoitteet
ipsRouter.get('/', async (request, response) => {
  const ips = await IPs.find({})
  //  .find({}).populate('user', { email: 1, name: 1 })

  response.json(ips)
})

//tallennetaan ip osoite
ipsRouter.post('/',userAuth, async (request, response) => {
  //Tallennetaan pyynnön body muuttujaan
  const body = request.body

  const user = await User.findById(request.decodedToken.id)

  //Vanhenemis aika millisekunneissa jos body.TTL on vuorokausia
  const expireDate = Date.now() + body.TTL * 86400 * 1000

  const ip = new IPs({
    ip: body.ip,
    desc: body.desc,
    user: user._id,
    expirationDate: expireDate,
  })
  //Tallennetaan ip kantaan
  const savedIP = await ip.save()
  //Tallennetaan käyttäjän tietoihin tallenetun IP:n id
  user.ips = user.ips.concat(savedIP._id)
  await user.save()
  //Palautetaan tallennettu IP
  response.status(201).json(savedIP)
})

const randomIP = (hostMin, hostMax, network) => {
  //Lasketaan kaikkien IP-osoitteiden määrä
  const countIP = ip.toLong(hostMax) - ip.toLong(hostMin)
  //Arvotaan IP-osoite annetuilla parametreilla
  const ipArray = ipblocks(hostMin, network, Math.floor(Math.random() * countIP))
  //Tehdään pisteillä erotettu stringi ipblocks:n palauttamasta arraysta
  const ipString = ipArray.join('.')
  //Palautetaan stringinä oleva ip osoite
  return ipString
}

const getNextIp = (networkId) => {
  //Etsitään verkkon tiedot kannasta
  return Network.findById(networkId)
    .then(network => {
      if (!network) {
        throw new Error('Network not found')
      }
      //Luodaan satunnainen IP-osoite
      const ipAddress = randomIP(network.hostMin, network.hostMax, network.hostNetwork)
      //Etsitään kannasta että löytyykö juuri luotu IP
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
ipsRouter.post('/next-ip',userAuth, async (request, response, next) => {
  const body = request.body
  
  //Otetaan kirjautuneen käyttäjän tiedot talteen
  const user = await User.findById(request.decodedToken.id)
  //Kutsutaan getNextIp funktiota
  getNextIp(body.networkId)
    .then(async ipAddress => {
      //const expireDate = Date.now() + body.TTL * 86400 * 1000
      //Asetetaan aika ensiksi 10 minuutiksi ja päivitetään oikea aika sitten vasta kun käyttäjä hyväksyy IP:n
      const expireDate = Date.now() + 600 * 1000
      const ip = new IPs({
        desc: body.desc,
        ip: ipAddress,
        user: user._id,
        expirationDate: expireDate,
      })
      //Varataan IP-osoite käyttöön
      const savedIP = await ip.save()

      user.ips = user.ips.concat(savedIP._id)
      await user.save()
      //Palautetaan varattu IP-osoite
      response.status(201).json({ message: 'Uusi IP-osoite luotu', savedIP })
    })
    .catch(error => {
      response.status(500).json({ message: 'Internal server error' })
      next(error)
    })
})

//Muokataan IP-osoitetta ja/tai kuvausta
ipsRouter.put('/next-ip/:id',userAuth, async (request, response, next) => {
  const body = request.body
  //Otetaan kirjautuneen käyttäjän tiedot talteen
  const user = await User.findById(request.decodedToken.id)
  
  //Vanhenemis aika millisekunneissa jos body.TTL on vuorokausia
  const expireDate = Date.now() + body.TTL * 86400 * 1000

  const ip = {
    ip: body.ip,
    desc: body.desc,
    user: user._id,
    expirationDate: expireDate,
  }

  IPs.findByIdAndUpdate(request.params.id, ip, { new: true })
    .then(updatedIP => {
      response.json(updatedIP)
    })
    .catch(error => next(error))
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
ipsRouter.put('/:id',userAuth, async (request, response, next) => {
  const body = request.body
  //Otetaan kirjautuneen käyttäjän tiedot talteen
  const user = await User.findById(request.decodedToken.id)

  const ip = {
    ip: body.ip,
    desc: body.desc,
    user: user._id,
  }

  IPs.findByIdAndUpdate(request.params.id, ip, { new: true })
    .then(updatedIP => {
      response.json(updatedIP)
    })
    .catch(error => next(error))
})

module.exports = ipsRouter