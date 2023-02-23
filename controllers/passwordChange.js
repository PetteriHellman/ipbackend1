const mongoose = require('mongoose')
const express = require('express');
const passRouter = express.Router();
const uniqueValidator = require('mongoose-unique-validator')
const bcrypt = require('bcrypt')
const User = require('../models/user')

  passRouter.post('/users/:id/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    console.log(req.body)
    try {
      const user = await User.findById(req.params.id);
      console.log(user)
      console.log(req.params.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
  
       // Hash and update new password
       const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(newPassword, salt);
       user.password = hashedPassword;
       await user.save();
  
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
  });

  module.exports = passRouter;