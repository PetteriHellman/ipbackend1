const bcrypt = require('bcrypt')
const readline = require('readline')
const User = require('../models/user')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

// create a new admin user with the given email, name and password
const createDefaultUser = async (email, name, passwordHash) => {
    try {
      // hash the password using bcrypt
      const saltRounds = 10;
      const hash = await bcrypt.hash(passwordHash, saltRounds);
  
      // create a new user object with the given email and hashed password
      const newUser = new User({
        email,
        name,
        passwordHash: hash, // Use the hashed password
        role: 'admin'
      });
  
      // save the user object to the database
      newUser.save((err) => {
        if (err) {
          console.log('Error creating admin user:', err.message);
        } else {
          console.log('Admin user created successfully');
        }
        // Close the readline interface when done
        rl.close();
        mongoose.disconnect();
      });
    } catch (err) {
      console.log('Error creating admin user:', err.message);
    }
  };

  // Ask the user for input and create a new admin user
rl.question('Enter admin email: ', (email) => {
    rl.question('Enter admin name: ', (name) => {
      rl.question('Enter admin password: ', (password) => {
        createAdminUser(email, name, password);
      });
    });
  });