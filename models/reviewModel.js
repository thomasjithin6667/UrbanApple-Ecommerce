const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',

  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 

  },
  title:{
    type:String
  },
  starRating: {
    type: Number,

    min: 1, 
    max: 5, 
  },
  description: {
    type: String,

  },
  date: {
    type: Date,
    default: Date.now, 
  },
});



module.exports  = mongoose.model('Review', reviewSchema);
