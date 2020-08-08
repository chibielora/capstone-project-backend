const mongoose = require('mongoose')

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
  // messages: [{
  //   body: { type: String, default: "", maxlength: 300 },
  //   user: { type: Schema.ObjectId, ref: "User" },
  //   commenterName: { type: String, default: "" },
  //   commenterPicture: { type: String, default: "" },
  //   createdAt: { type: Date, default: Date.now }
  // }],
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

module.exports = mongoose.model('Post', PostSchema)
