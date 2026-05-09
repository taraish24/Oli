const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.id, email: decoded.email }
    return next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = authMiddleware
