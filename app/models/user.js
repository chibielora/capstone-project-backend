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
  followers: [],
  following: [],
  profileImgURL:{
    type: String
  },
  numposts: {
    type: Number
  },
  posts: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
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

// UserSchema.statics = {
//   addfollow: function (id, cb) {
//     this.findOne({
//         _id: id
//       })
//       .populate("followers")
//       .exec(cb);
//   },
//   countUserPosts: function (id, cb) {
//     return Post.find({
//         user: id
//       })
//       .countDocuments()
//       .exec(cb);
//   },
//   load: function(options, cb) {
//     options.select = options.select || "name username";
//     return this.findOne(options.criteria)
//       .select(options.select)
//       .exec(cb);
//   },  
//   list: function (options) {
//     const criteria = options.criteria || {};
//     return this.find(criteria)
//       .populate("user", "name username")
//       .limit(options.perPage)
//       .skip(options.perPage * options.page);
//   },
//   countTotalUsers: function () {
//     return this.find({}).countDocuments();
//   }
// };

module.exports = mongoose.model('User', UserSchema)
