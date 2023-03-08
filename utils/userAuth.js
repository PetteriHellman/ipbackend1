const jwt = require('jsonwebtoken')

const userAuth = (request, response, next) => {
  const authHeader = request.get('Authorization')
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return response.status(401).json({ error: 'missing or invalid token' })
  }
  const token = authHeader.substring(7)
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (decodedToken.role !== 'user') {
      return response.status(401).json({ error: 'unauthorized' })
    }
    request.decodedToken = decodedToken
    next()
  } catch (error) {
    return response.status(401).json({ error: 'missing or invalid token' })
  }
}

module.exports = userAuth