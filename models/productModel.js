const mongoose = require('mongoose');



const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    quantity: Number,
    productImages: [String], 
    battery: String,
    productColor: String,
    ratings: [Number],
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
      discountPrice: {
          type: Number,
          default: 0,
        },
        discount:Number,
        startDate: Date,
        endDate: Date,
        discountStatus: {
            type:Boolean,
        default:true}
        
});

module.exports = mongoose.model('Product', productSchema);