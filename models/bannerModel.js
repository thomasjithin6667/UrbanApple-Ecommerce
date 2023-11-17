const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  image: String,
  link: String,
  subtitle: String,
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
},  
createdAt: {
  type: Date,
  default: Date.now,
},
  isListed : {
    type : Boolean,
    default : true
}
  
});



module.exports = mongoose.model('Banner', bannerSchema); ;
