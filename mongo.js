const mongoose = require('mongoose')

if (process.argv.length<3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url =
  `mongodb+srv://admin:${password}@cluster0.chqauzf.mongodb.net/ipdatabase?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const kayttajaSchema = new mongoose.Schema({
  id: Number, 
  nimi: String,
  sähköposti: String,
  salasana: String,
  ip: String,
  ryhmä: String,
  tyyppi: String,

})

const Kayttaja = mongoose.model('Kayttaja', kayttajaSchema)

const kayttaja = new Kayttaja({
  id: 1, 
  nimi: "Petteri Hellman",
  sahkoposti: "hfhfhf@gmail.com",
  salasana: "123456",
  ip: "192.1.128.31",
  ryhma: "STMI17SPA",
  tyyppi: "user",
})

// Note.find({}).then(result => {
//     result.forEach(note => {
//       console.log(note)
//     })
//     mongoose.connection.close()
//   })

kayttaja.save().then(result => {
  console.log('User saved!')
  mongoose.connection.close()
})