const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: String,
    rating: Number,
    review: String,
    date: Date,
    image: String,
});

const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    discountPrice: Number,
    quantity: Number,
    productImages: [String], 
    battery: String,
    productColor: String,
    ratings: [ratingSchema],
    ram: String,
    rom: String,
    expandable: String,
    frontCam: String,
    rearCam: String,
    processor: String,
    list:{
        type:Boolean,
        default:true
    },
    orderDate: {
        type: Date,
        default: Date.now,
      },
});

module.exports = mongoose.model('Product', productSchema);