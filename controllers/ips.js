const ipsRouter = require('express').Router()

const IPs = require('../models/ip')
const User = require('../models/user')

const jwt = require('jsonwebtoken')
const ipblocks = require('ip-blocks')


const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

//haetaan kaikki IP-osoitteet
ipsRouter.get('/', async (request, response) => {
  const ips = await IPs
  //  .find({}).populate('user', { email: 1, name: 1 })
    .find({})

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

const randomIP = () => {
  //Arvotaan IP-osoite 668 osoitteesta, jossa 10.36.64.101 on ensimmäinen osoite ja 10.36.66.254 on viimeinen /22 netmaskilla
  const ipArray = ipblocks('10.36.64.101', 22, Math.floor(Math.random() *(668 - 101) + 101))

  //Tehdään pisteillä erotettu stringi ipblocks:n palauttamasta arraysta
  const ipString = ipArray.join('.')
  
  //Palautetaan stringinä oleva ip osoite
  return ipString
}

ipsRouter.get('/next-ip', async (request, response) => {
  //Generoidaan satunainen IP-soite
  const ip = randomIP()

  //Muodostetaan tietokanta kysely
  const query = IPs.where({ ip: ip })

  //Jos kannasta ei löydy osoitetta plautetaan generoitu IP-osoite
  if (await query.findOne() == null) {
    response.json({'ip' :ip})
  }
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