const ipsRouter = require('express').Router()

const IPs = require('../models/ip')
const User = require('../models/user')
const Network = require('../models/network')

//const userAuth = require('../utils/userAuth')
const auth = require('../utils/auth')

const ipblocks = require('ip-blocks')
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

//haetaan seuraava vapaa viereikkäin oleva IP-blokki 
const nextFreeIPBlock = (size, network, taken) => {
    const max = ip.toLong(network.hostMax)
    const min = ip.toLong(network.hostMin)

    if (size < 1 || size > 5) size = 1; //tarkistus, että haetaan vain 1-5 IP:tä

    let start = 0;
    let possible;

    for (i = min; i < max; i++) 
    {
        if (!taken.includes(i)) 
        {
            start++;
            if(start==1) possible = i;
            //console.log(start);
        } 
        else start = 0;
        if (start == size)
        {
            return Array(size).fill().map((_, index) => intToIP(possible + index))
        }
    }
    return false;
}

const getNextIp = (networkId, taken, amount) => {
  //Etsitään verkkon tiedot kannasta
  return Network.findById(networkId)
    .then(network => {
      if (!network) {
        throw new Error('Network not found')
      }
      return nextFreeIPBlock(amount, network, taken);
      //Luodaan satunnainen IP-osoite
      //const ipAddress = randomIP(network.hostMin, network.hostMax, network.hostNetwork)
      //console.log(ipAddress);
      //Etsitään kannasta että löytyykö juuri luotu IP
    //   return IPs.findOne({ ip: ipAddress }).limit(1)
    //     .then(existingIp => {
    //       if (existingIp) {
    //         //Jos kannasta löytyy jo kyseinen osoite ajetaan sama funktio uudelleen
    //         return getNextIp(networkId)
    //       } else {
    //         //Jos kannasta ei löydy kyseistä osoistetta palautetaan se
    //         return ipAddress
    //       }
    //     })
    })
}

//Tarjotaan uutta satunnaisesti generoitua IP-osoitetta
ipsRouter.post('/next-ip',auth, async (request, response, next) => {
  /*
  #swagger.tags = ['Autogen IP address']
  #swagger.summary = 'Endpoint for provide next free IP address.'
  #swagger.description = 'Endpoint for provide next free IP address.'
  #swagger.security = [{"bearerAuth": []}]
  */
  const body = request.body
  const amount = body.amount
  //Haetaan kaikki jo varatut IP:t
  const taken = (await IPs.find({})).map((item) => (ip.toLong(item.ip)));
  //Otetaan kirjautuneen käyttäjän tiedot talteen
  const user = await User.findById(request.decodedToken.id)
  //Kutsutaan getNextIp funktiota
  getNextIp(body.networkId, taken, amount)
    .then(async ipAddress => {
      //const expireDate = Date.now() + body.TTL * 86400 * 1000
      //Asetetaan aika ensiksi 10 minuutiksi ja päivitetään oikea aika sitten vasta kun käyttäjä hyväksyy IP:n
      const expireDate = Date.now() + 600 * 1000
      const ip = [];
      ipAddress.forEach(e => { //pusketaan haetut IP:t (string) muotoiltuun objekti-taulukkoon (IPs)
        ip.push(new IPs({
          desc: body.desc,
          ip: e,
          user: user._id,
          expirationDate: expireDate,
        }))
      });
      //Varataan IP-osoitteet käyttöön
      const savedIP = await IPs.insertMany(ip)
      savedIP.forEach((e) => {
        user.ips.push(e._id)
      });

      //user.ips = user.ips.concat(savedIP._id)
      await user.save()
      //Palautetaan varattu IP-osoite
      response.status(201).json({ message: 'Uusi IP-osoite luotu', savedIP })
    })
    .catch(error => {
      response.status(500).json({ message: 'Internal server error' })
      next(error)
    })
})

//Vahvistetaan automaattisesti generoitu IP oikealla vanhenemisajalla
ipsRouter.put('/next-ip/:id',auth, async (request, response, next) => {
  /*
  #swagger.tags = ['Autogen IP address']
  #swagger.summary = 'Endpoint for provide next free IP address confirm.'
  #swagger.description = 'Endpoint for provide next free IP address confirm.'
  #swagger.security = [{"bearerAuth": []}]
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
ipsRouter.get('/:id',auth, async (request, response) => {
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
ipsRouter.delete('/:id',auth, async (request, response) => {
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
ipsRouter.put('/:id',auth, async (request, response, next) => {
  /*
  #swagger.tags = ['IP address']
  #swagger.summary = 'Endpoint for edit single IP address and/or description.'
  #swagger.description = 'Endpoint for edit single IP address and/or description.'
  #swagger.security = [{"bearerAuth": []}]
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

module.exports = ipsRouter

function intToIP(int) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}