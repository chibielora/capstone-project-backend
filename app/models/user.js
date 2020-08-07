const mongoose = require('mongoose')
const Post = mongoose.model("Post")
const Schema = mongoose.Schema

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  followers: [{
    type: Schema.ObjectId, ref: 'user'
  }],
  following: {
    type: Schema.ObjectId, ref: 'user'
  },
  posts: {
    type: Number
  },
  token: String
}, {
  usePushEach: true,
  timestamps: true,
  toObject: {
    // remove `hashedPassword` field when we call `.toObject`
    transform: (_doc, user) => {
      delete user.hashedPassword
      return user
    }
  }
})

UserSchema.statics = {
  addfollow: function (id, cb) {
    this.findOne({
        _id: id
      })
      .populate("followers")
      .exec(cb);
  },
  countUserPosts: function (id, cb) {
    return Post.find({
        user: id
      })
      .countDocuments()
      .exec(cb);
  },
  list: function (options) {
    const criteria = options.criteria || {};
    return this.find(criteria)
      .populate("user", "name username")
      .limit(options.perPage)
      .skip(options.perPage * options.page);
  },
  countTotalUsers: function () {
    return this.find({}).countDocuments();
  }
};

module.exports = mongoose.model('User', UserSchema)
