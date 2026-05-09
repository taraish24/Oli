const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfigured' })
    }

    const email = req.body?.email
    const password = req.body?.password
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim() } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', (_req, res) => res.status(200).json({ message: 'Logged out' }))

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(user)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const name = req.body?.name
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name must be a non-empty string' })
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
      select: { id: true, email: true, name: true },
    })

    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
