const http = require('http')
const express = require('express')
const cors = require('cors')
const { response } = require('express')
const app = express()

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

let iptable = [
  {
    "user" : "jorma",
    "id" : 1,
    "ips" : [
      {
        "ip" : "10.36.64.101",
        "desc" : "server 1",
        "id" : 1
      },
      {
        "ip" : "10.36.64.102",
        "desc" : "server 2",
        "id" : 2
      }
    ],
  },
  {
    "user" : "jaska",
    "id" : 2,
    "ips" : [
      {
        "ip" : "10.36.64.103",
        "desc" : "server 1",
        "id" : 1
      },
      {
        "ip" : "10.36.64.104",
        "desc" : "server 2",
        "id" : 2
      }
    ],
  }
]



app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/iptable/', (request, response) => {
  response.json(iptable)

})

app.get('/api/iptable/:id', (request, response) => {
  const id = Number(request.params.id)
  const user = iptable.find(user => user.id === id)
  if (user) {
    response.json(user)
  } else {
    response.status(404).end()
  }
})

app.post('/api/iptable/user', (request, response) => {
  const body = request.body
  const user = {
    user: body.user,
    id: generateId()
  }
  iptable = iptable.concat(user)
  response.json(user)

})

const generateId = () => {
  const id = Math.round(Math.random() * 1000000)
  return id
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})