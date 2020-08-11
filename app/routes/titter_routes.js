// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for titter
const Post = require('../models/titter')

const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()

// INDEX OF POSTS
router.get('/posts', requireToken, (req, res, next) => {
  Post.find()
    .populate('user', 'username')
    .sort({ createdAt: -1})
    .then(posts => {
      // `examples` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return posts.map(post => post.toObject())
    })
    // respond with status 200 and JSON of the examples
    .then(posts => res.status(200).json({ posts: posts }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW POSTS BY ID
router.get('/posts/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Post.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "example" JSON
    .then(post => res.status(200).json({ post: post.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})


// INDEX OF WHO USER IS FOLLOWING
router.get('/posts/following', requireToken, (req, res, next) => {
  Post.find({
    'user.id': { following: req.user.following}  //Come back to this later
  })
    .sort({ createdAt: -1 })
    .then(posts => {
      // `examples` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return posts.map(post => post.toObject())
    })
    // respond with status 200 and JSON of the examples
    .then(posts => res.status(200).json({
      posts: posts
    }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW USER BY ID
router.get('/users/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Post.find({'user.id': req.params.id})
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "example" JSON
    .then(post => res.status(200).json({
      post: post.toObject()
    }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /examples
router.post('/posts', requireToken, (req, res, next) => {
  const message = req.body.post.message.trim()
  console.log(message)
  const newPost = new Post({
    body: message,
    user: req.user.id 
  })
  newPost.save()
    // respond to succesful `create` with status 201 and JSON of new "example"
    .then(post => {
      Post.findById(post._id)
        .populate('user', 'username')
        .then(post => {
          res.status(201).json({ post: post.toObject() })
        })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /examples/5a7db6c74d55bc51bdf39793
router.patch('/posts/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.post.owner

  Post.findById(req.params.id)
    .then(handle404)
    .then(post => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, post)

      // pass the result of Mongoose's `.update` to the next `.then`
      return post.updateOne(req.body.post)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /examples/5a7db6c74d55bc51bdf39793
router.delete('/posts/:id', requireToken, (req, res, next) => {
  Post.findById(req.params.id)
    .then(handle404)
    .then(post => {
      // throw an error if current user doesn't own `example`
      requireOwnership(req, post)
      // delete the example ONLY IF the above didn't throw
      post.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
