const express = require('express')
// jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
const crypto = require('crypto')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// bcrypt docs: https://github.com/kelektiv/node.bcrypt.js
const bcrypt = require('bcrypt')

// see above for explanation of "salting", 10 rounds is recommended
const bcryptSaltRounds = 10
const errors = require('../../lib/custom_errors')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const BadParamsError = errors.BadParamsError
const BadCredentialsError = errors.BadCredentialsError
const User = require('../models/user')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()

// SIGN UP
// POST /sign-up
router.post('/sign-up', (req, res, next) => {
  // start a promise chain, so that any errors will pass to `handle`
  Promise.resolve(req.body.credentials)
    // reject any requests where `credentials.password` is not present, or where
    // the password is an empty string
    .then(credentials => {
      if (!credentials ||
          !credentials.password ||
          credentials.password !== credentials.passwordConfirmation) {
        throw new BadParamsError()
      }
    })
    // generate a hash from the provided password, returning a promise
    .then(() => bcrypt.hash(req.body.credentials.password, bcryptSaltRounds))
    .then(hash => {
      // return necessary params to create a user
      return {
        username: req.body.credentials.email,
        email: req.body.credentials.email,
        hashedPassword: hash
      }
    })
    // create user with provided email and hashed password
    .then(user => User.create(user))
    // send the new user object back with status 201, but `hashedPassword`
    // won't be send because of the `transform` in the User model
    .then(user => res.status(201).json({ user: user.toObject() }))
    // pass any errors along to the error handler
    .catch(next)
})

// SIGN IN
// POST /sign-in
router.post('/sign-in', (req, res, next) => {
  const pw = req.body.credentials.password
  let user

  // find a user based on the email that was passed
  User.findOne({ email: req.body.credentials.email })
    .then(record => {
      // if we didn't find a user with that email, send 401
      if (!record) {
        throw new BadCredentialsError()
      }
      // save the found user outside the promise chain
      user = record
      // `bcrypt.compare` will return true if the result of hashing `pw`
      // is exactly equal to the hashed password stored in the DB
      return bcrypt.compare(pw, user.hashedPassword)
    })
    .then(correctPassword => {
      // if the passwords matched
      if (correctPassword) {
        // the token will be a 16 byte random hex string
        const token = crypto.randomBytes(16).toString('hex')
        user.token = token
        // save the token to the DB as a property on user
        return user.save()
      } else {
        // throw an error to trigger the error handler and end the promise chain
        // this will send back 401 and a message about sending wrong parameters
        throw new BadCredentialsError()
      }
    })
    .then(user => {
      // return status 201, the email, and the new token
      res.status(201).json({ user: user.toObject() })
    })
    .catch(next)
})

// MAIN PAGE
router.get('/', requireToken,(req, res, next) => {
  res.json({
    _id: req.user._id,
    email: req.user.email,
    username: req.user.username,
    followers: req.user.followers,
    following: req.user.following
  })
})

// SEARCH USERS
router.post('/users/search', (req, res, next) => {
  User.findOne({ $or: [
    { email: req.body.text },
    { username: req.body.text } ]
  })
  .then(user => res.json({ userId: user._id }))
  .catch(next)
})

// SHOW USER BY ID
router.get('/users/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  User.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "example" JSON
    .then(user => res.status(200).json({
      user: user.toObject()
    }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// FOLLOW
router.post('/users/:userId/follow', requireToken, (req, res, next) => {
  User.findOneAndUpdate({ _id: req.user.id }, 
    { $addToSet: { following: req.params.userId }},
    { new: true })
  .then(user => {
    User.findOneAndUpdate({ _id: req.params.userId
      }, {
      $addToSet: { followers: req.user.id }
      }, { new: true})
    .then(user => res.json({ userId: req.params.userId }))
    .catch(next)
  })
  .catch(next)
})

// UNFOLLOW
router.post('/users/:userId/unfollow', requireToken, (req, res, next) => {
  User.findOneAndUpdate({ _id: req.user.id}, 
    { $pull: { following: req.params.userId } }, 
    { new: true })
  .then(user => {
  User.findOneAndUpdate({ _id: req.params.userId }, 
    { $pull: { followers: req.user.id } }, 
    { new: true })
    .then(user => res.json({ userId: req.params.userId }))
    .catch(next)
  })
  .catch(next)
})

    
// CHANGE password
// PATCH /change-password
router.patch('/change-password', requireToken, (req, res, next) => {
  let user
  // `req.user` will be determined by decoding the token payload
  User.findById(req.user.id)
    // save user outside the promise chain
    .then(record => { user = record })
    // check that the old password is correct
    .then(() => bcrypt.compare(req.body.passwords.oldPassword, user.hashedPassword))
    // `correctPassword` will be true if hashing the old password ends up the
    // same as `user.hashedPassword`
    .then(correctPassword => {
      // throw an error if the new password is missing, an empty string,
      // or the old password was wrong
      if (!req.body.passwords.newPassword || !correctPassword) {
        throw new BadParamsError()
      }
    })
    // hash the new password
    .then(() => bcrypt.hash(req.body.passwords.newPassword, bcryptSaltRounds))
    .then(hash => {
      // set and save the new hashed password in the DB
      user.hashedPassword = hash
      return user.save()
    })
    // respond with no content and status 200
    .then(() => res.sendStatus(204))
    // pass any errors along to the error handler
    .catch(next)
})

router.delete('/sign-out', requireToken, (req, res, next) => {
  // create a new random token for the user, invalidating the current one
  req.user.token = crypto.randomBytes(16)
  // save the token and respond with 204
  req.user.save()
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
