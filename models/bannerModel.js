const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  image: String,
  link: String,
  subtitle: String,
  position: String,

  isListed : {
    type : Boolean,
    default : true
}
  
});



module.exports = mongoose.model('Banner', bannerSchema); ;
