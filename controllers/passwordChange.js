const express = require('express')
const passRouter = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

passRouter.post('/users/:id/change-password', async (req, res, next) => {
  const { oldPassword, newPassword } = req.body
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' })
      
    }
    
    // Hash and update new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    user.passwordHash = hashedPassword
    await user.save()

    res.status(200).json({ message: 'Password updated successfully' })
    
  } catch (error) {
    next(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = passRouter