const mongoose = require('mongoose')
const Schema = mongoose.Schema

//  Getters and Setters
const setTags = tags => tags.map(t => t.toLowerCase())

const PostSchema = new mongoose.Schema( {
  body: {
    type: String, 
    default: "", 
    trim: true, 
    maxlength: 300 
  },
  user: { 
    type: Schema.ObjectId, 
    ref: "User",
    required: true
  },
  messages: [{
    body: { type: String, default: "", maxlength: 300 },
    user: { type: Schema.ObjectId, ref: "User" },
    // commenterName: { type: String, default: "" },
    // commenterPicture: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: { 
  type: [String], 
  set: setTags
  },
  favorites: [{ 
    type: Schema.ObjectId, 
    ref: "User" 
  }],
  myfavorites: [{ 
    type: Schema.ObjectId, 
    ref: "User" 
  }],
  favoritesCount: Number,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }},
  { usePushEach: true }
)

// PostSchema.pre("save", function (next) {
//   if (this.favorites) {
//     this.favoritesCount = this.favorites.length
//   }
//   if (this.favorites) {
//     this.myfavorites = this.favorites
//   }
//   next()
// })



// PostSchema.statics = {
//   // Load posts
//   load: function (id, callback) {
//     this.findOne({
//         _id: id
//       })
//       .populate("user", "name username")
//       .populate("comments.user")
//       .exec(callback)
//   },
//   // List posts
//   list: function (options) {
//     const criteria = options.criteria || {}
//     return this.find(criteria)
//       .populate("user", "name username")
//       .sort({
//         createdAt: -1
//       })
//       .limit(options.perPage)
//       .skip(options.perPage * options.page)
//   },
//   // List posts
//   limitedList: function (options) {
//     const criteria = options.criteria || {}
//     return this.find(criteria)
//       .populate("user", "name username")
//       .sort({
//         createdAt: -1
//       })
//       .limit(options.perPage)
//       .skip(options.perPage * options.page)
//   },
//   // User Posts
//   userPosts: function (id, callback) {
//     this.find({
//         user: ObjectId(id)
//       })
//       .toArray()
//       .exec(callback)
//   },

//   countUserPosts: function (id, callback) {
//     return this.find({
//         user: id
//       })
//       .countDocuments()
//       .exec(callback)
//   },

//   countPosts: function (criteria) {
//     return this.find(criteria).countDocuments()
//   }
// }

module.exports = mongoose.model('Post', PostSchema)
