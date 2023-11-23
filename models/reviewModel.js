const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  starRating: {
    type: Number,
    required: true,
    min: 1, 
    max: 5, 
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, 
  },
});



module.exports  = mongoose.model('Review', reviewSchema);
