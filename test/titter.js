process.env.TESTENV = true

let Post = require('../app/models/titter.js')
let User = require('../app/models/user')

const crypto = require('crypto')

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
chai.should()

chai.use(chaiHttp)

const token = crypto.randomBytes(16).toString('hex')
let userId
let postId

describe('Post', () => {
  const postParams = {
    title: '13 JavaScript tricks SEI instructors don\'t want you to know',
    text: 'You won\'believe number 8!'
  }

  before(done => {
    Post.deleteMany({})
      .then(() => User.create({
        email: 'caleb',
        hashedPassword: '12345',
        token
      }))
      .then(user => {
        userId = user._id
        return user
      })
      .then(() => Post.create(Object.assign(postParams, {owner: userId})))
      .then(record => {
        postId = record._id
        done()
      })
      .catch(console.error)
  })

  describe('GET /post', () => {
    it('should get all the post', done => {
      chai.request(server)
        .get('/post')
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.post.should.be.a('array')
          res.body.post.length.should.be.eql(1)
          done()
        })
    })
  })

  describe('GET /post/:id', () => {
    it('should get one post', done => {
      chai.request(server)
        .get('/post/' + postId)
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.post.should.be.a('object')
          res.body.post.title.should.eql(postParams.title)
          done()
        })
    })
  })

  describe('DELETE /post/:id', () => {
    let postId

    before(done => {
      Post.create(Object.assign(postParams, { owner: userId }))
        .then(record => {
          postId = record._id
          done()
        })
        .catch(console.error)
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .delete('/post/' + postId)
        .set('Authorization', `Bearer notarealtoken`)
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should be succesful if you own the resource', done => {
      chai.request(server)
        .delete('/post/' + postId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 if the resource doesn\'t exist', done => {
      chai.request(server)
        .delete('/post/' + postId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /post', () => {
    it('should not POST an post without a title', done => {
      let noTitle = {
        text: 'Untitled',
        owner: 'fakedID'
      }
      chai.request(server)
        .post('/post')
        .set('Authorization', `Bearer ${token}`)
        .send({ post: noTitle })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not POST an post without text', done => {
      let noText = {
        title: 'Not a very good post, is it?',
        owner: 'fakeID'
      }
      chai.request(server)
        .post('/post')
        .set('Authorization', `Bearer ${token}`)
        .send({ post: noText })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not allow a POST from an unauthenticated user', done => {
      chai.request(server)
        .post('/post')
        .send({ post: postParams })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should POST an post with the correct params', done => {
      let validPost = {
        title: 'I ran a shell command. You won\'t believe what happened next!',
        text: 'it was rm -rf / --no-preserve-root'
      }
      chai.request(server)
        .post('/post')
        .set('Authorization', `Bearer ${token}`)
        .send({ post: validPost })
        .end((e, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('post')
          res.body.post.should.have.property('title')
          res.body.post.title.should.eql(validPost.title)
          done()
        })
    })
  })

  describe('PATCH /post/:id', () => {
    let postId

    const fields = {
      title: 'Find out which HTTP status code is your spirit animal',
      text: 'Take this 4 question quiz to find out!'
    }

    it('must be owned by the user', done => {
      chai.request(server)
        .patch('/post/' + postId)
        .set('Authorization', `Bearer notarealtoken`)
        .send({ post: fields })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should update fields when PATCHed', done => {
      chai.request(server)
        .patch(`/post/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ post: fields })
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('shows the updated resource when fetched with GET', done => {
      chai.request(server)
        .get(`/post/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.post.title.should.eql(fields.title)
          res.body.post.text.should.eql(fields.text)
          done()
        })
    })

    it('doesn\'t overwrite fields with empty strings', done => {
      chai.request(server)
        .patch(`/post/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ post: { text: '' } })
        .then(() => {
          chai.request(server)
            .get(`/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((e, res) => {
              res.should.have.status(200)
              res.body.should.be.a('object')
              // console.log(res.body.post.text)
              res.body.post.title.should.eql(fields.title)
              res.body.post.text.should.eql(fields.text)
              done()
            })
        })
    })
  })
})
