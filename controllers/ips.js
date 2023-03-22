const ipsRouter = require('express').Router()
const IPs = require('../models/ip')
const User = require('../models/user')
const Network = require('../models/network')
const auth = require('../utils/auth')
// const ipblocks = require('ip-blocks')
const ip = require('ip')

//haetaan kaikki IP-osoitteet adminille
ipsRouter.get('/', auth, async (request, response) => {
  /*
  #swagger.tags = ['IP address']
  #swagger.summary = 'Endpoint for get all IP address for admins.'
  #swagger.description = 'Endpoint for get all IP address for admins.'
  #swagger.security = [{"bearerAuth": []}]
  */
  const decodedToken = request.decodedToken
  if (decodedToken.role === 'admin') {
    const ips = await IPs.find({})
    response.json(ips)
  } else {
    return response.status(401).json({ error: 'unauthorized' })
  }
})

//tallennetaan ip osoite adminille
ipsRouter.post('/', auth, async (request, response) => {
  /*
  #swagger.tags = ['IP address']
  #swagger.summary = 'Endpoint for save IP address for admins.'
  #swagger.description = 'Endpoint for save IP address for admins.'
  #swagger.security = [{"bearerAuth": []}]
 
  #swagger.parameters['ip','desc','TTL'] = {
        in: 'body',
        description: {
          $ip: 'IP address',
          $desc: 'Description for IP address',
          $TTL: 'TTL (Time-to-Live) value for IP address in days'
        },
        required: 'true',
        type: {
          $ip: 'string',
          $desc: 'string',
          $TTL: 'number'
        },
        schema: {
          $ip: '192.168.0.1',
          $desc: 'Some description',
          $TTL: 1,
        }
  }
  */
  if (request.decodedToken.role == 'admin') {
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
  }
  else {
    response.status(404).end()
  }
})

// const randomIP = (hostMin, hostMax, network) => {
//   //Lasketaan kaikkien IP-osoitteiden määrä
//   const countIP = ip.toLong(hostMax) - ip.toLong(hostMin)
//   //Arvotaan IP-osoite annetuilla parametreilla
//   const ipArray = ipblocks(hostMin, network, Math.floor(Math.random() * countIP))
//   //Tehdään pisteillä erotettu stringi ipblocks:n palauttamasta arraysta
//   const ipString = ipArray.join('.')
//   //Palautetaan stringinä oleva ip osoite
//   return ipString
// }

//haetaan seuraava vapaa viereikkäin oleva IP-blokki 
const nextFreeIPBlock = (network, taken, size, role) => {
  const max = ip.toLong(network.hostMax)
  const min = ip.toLong(network.hostMin)

  //tarkistus, että haetaan vain 1-5 IP:tä, jos hakijana käyttäjä
  if (role === 'user' && (size < 1 || size > 5)) throw new Error('Invalid amount requested as ' + role)

  let start = 0
  let possible
  let i

  for (i = min; i < max; i++) {
    if (!taken.includes(i)) {
      start++
      if (start == 1) possible = i
      //console.log(start);
    }
    else start = 0
    if (start == size) {
      return Array(size).fill().map((_, index) => intToIP(possible + index))
    }
  }
  throw new Error('Not enough free contiguous IP addresses at given block size')
}

const getNextIp = (taken, amount, role) => {
  //Etsitään verkkon tiedot kannasta
  return Network.findOne({ networkActive: true })
    .then(network => {
      if (!network) {
        throw new Error('Network not found')
      }
      return nextFreeIPBlock(network, taken, amount, role)
    })
}

//Tarjotaan uutta satunnaisesti generoitua IP-osoitetta
ipsRouter.post('/next-ip', auth, async (request, response, next) => {
  /*
  #swagger.tags = ['Autogen IP address']
  #swagger.summary = 'Endpoint for provide next free IP address.'
  #swagger.description = 'Endpoint for provide next free IP address.'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['desc','amount'] = {
        in: 'body',
        description: {
          $desc: 'Description for IP address',
          $amount: 'Amount of ip addresses needed'
        },
        required: 'true',
        type: {
          $desc: 'string',
          $amount: 'number'
        },
        schema: {
          $desc: 'Some description',
          $amount: 1,
        }
  }
  */
  const body = request.body
  const amount = body.amount
  //Haetaan kaikki jo varatut IP:t
  const taken = (await IPs.find({})).map((item) => (ip.toLong(item.ip)))
  //Otetaan kirjautuneen käyttäjän tiedot talteen
  const user = await User.findById(request.decodedToken.id)
  //checking if active
  const networkActivity = await Network.findOne({ networkActive: true })
  if (!networkActivity) {
    return response.status(400).json({ message: 'Active network not found' })
  }
  //Kutsutaan getNextIp funktiota
  getNextIp( taken, amount, user.role)
    .then(async ipAddress => {
      //const expireDate = Date.now() + body.TTL * 86400 * 1000
      //Asetetaan aika ensiksi 10 minuutiksi ja päivitetään oikea aika sitten vasta kun käyttäjä hyväksyy IP:n
      const expireDate = Date.now() + 600 * 1000
      const ip = []
      ipAddress.forEach(e => { //pusketaan haetut IP:t (string) muotoiltuun objekti-taulukkoon (IPs)
        ip.push(new IPs({
          desc: body.desc,
          ip: e,
          user: user._id,
          expirationDate: expireDate,
        }))
      })
      //Varataan IP-osoitteet käyttöön
      const savedIP = await IPs.insertMany(ip)
      savedIP.forEach((e) => {
        user.ips.push(e._id)
      })

      //user.ips = user.ips.concat(savedIP._id)
      await user.save()
      //Palautetaan varattu IP-osoite
      response.status(201).json({ message: 'Uusi IP-osoite luotu', savedIP })
    })
    .catch(error => {
      response.status(500).json({ message: 'Internal server error: ' + error.message })
      next(error)
    })
})

//Vahvistetaan automaattisesti generoitu IP oikealla vanhenemisajalla
ipsRouter.put('/next-ip/:id', auth, async (request, response, next) => {
  /*
  #swagger.tags = ['Autogen IP address']
  #swagger.summary = 'Endpoint for provide next free IP address confirm.'
  #swagger.description = 'Endpoint for provide next free IP address confirm.'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['desc','TTL'] = {
        in: 'body',
        description: {
          $desc: 'Description for IP address',
          $TTL: 'TTL (Time-to-Live) value for IP address in days',
        },
        required: 'true',
        type: {
          $desc: 'string',
          $TTL: 'number'
        },
        schema: {
          $desc: 'Some description',
          $TTL: 1,
        }
  }
  */
  const body = request.body
  //Otetaan kirjautuneen käyttäjän tiedot talteen
  //const user = await User.findById(request.decodedToken.id)

  //Vanhenemis aika millisekunneissa jos body.TTL on vuorokausia
  const expireDate = Date.now() + body.TTL * 86400 * 1000

  const ip = {
    desc: body.desc,
    expirationDate: expireDate,
  }

  IPs.findByIdAndUpdate(request.params.id, ip, { new: true })
    .then(updatedIP => {
      response.json(updatedIP)
    })
    .catch(error => next(error))
})

//Haetaan yksittäinen IP-osoite
ipsRouter.get('/:id', auth, async (request, response) => {
  /*
  #swagger.tags = ['IP address']
  #swagger.summary = 'Endpoint for get single IP address.'
  #swagger.description = 'Endpoint for get single IP address.'
  #swagger.security = [{"bearerAuth": []}]
  */
  const ip = await IPs.findById(request.params.id)
  if (ip) {
    response.json(ip)
  } else {
    response.status(404).end()
  }
})

//Poistetaan IP-osoite
ipsRouter.delete('/:id', auth, async (request, response) => {
  /*
  #swagger.tags = ['IP address']
  #swagger.summary = 'Endpoint for delete single IP address.'
  #swagger.description = 'Endpoint for delete single IP address.'
  #swagger.security = [{"bearerAuth": []}]
  */
  await IPs.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

//Muokataan IP-osoitetta ja/tai kuvausta
ipsRouter.put('/:id', auth, async (request, response, next) => {
  /*
  #swagger.tags = ['IP address']
  #swagger.summary = 'Endpoint for edit single IP address and/or description.'
  #swagger.description = 'Endpoint for edit single IP address and/or description.'
  #swagger.security = [{"bearerAuth": []}]
  #swagger.parameters['desc','ip'] = {
        in: 'body',
        description: {
          $desc: 'New description for IP address',
          $ip: 'IP address what you want edit',
        },
        type: {
          $desc: 'string',
          $ip: 'string'
        },
        schema: {
          $desc: 'Some new description',
          $ip: '192.168.0.2',
        }
  }
  */
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

function intToIP(int) {
  var part1 = int & 255
  var part2 = ((int >> 8) & 255)
  var part3 = ((int >> 16) & 255)
  var part4 = ((int >> 24) & 255)

  return part4 + '.' + part3 + '.' + part2 + '.' + part1
}

module.exports = ipsRouter