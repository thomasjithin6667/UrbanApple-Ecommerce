const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const Address = require('../models/addressesModel')
const mongoose = require('mongoose')
const Coupon= require('../models/couponModel')
const Banner = require('../models/bannerModel')

const addBanner = async (req, res) => {
    try {

      const { title, link, subtitle, position, isListed } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Banner image is required' });
      }
  
      const image = req.file.filename;
  

      const newBanner = new Banner({
        title,
        image,
        link,
        subtitle,
        position,
        isListed: isListed || true,
      });

      const savedBanner = await newBanner.save();
  
      res.status(201).json(savedBanner); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while adding the banner' });
    }
  };
  

const loadAddBanner= (req, res)=>{
    const admin=  req.session.adminData

    res.render('banner-add',{admin:admin})
}


const loadEditBanner= (req, res)=>{
    const admin=  req.session.adminData

    res.render('banner-edit',{admin:admin})
}





const loadBannerList = async (req, res)=>{
    const admin=  req.session.adminData
    const banner = await Banner.find()
    res.render('banner-list', {banner,admin:admin})
}







const unlistBanner = async (req, res) => {
    try {
        const id = req.query.id;

         
        const banner = await Banner.findById(id);



        banner.isListed = !banner.isListed;


        await banner.save();

        res.redirect('/admin/banner-list');
    } catch (error) {
        console.log(error.message);


    }
}













module.exports = {
    loadAddBanner,
    loadBannerList,
    addBanner,
    loadEditBanner,
   
    unlistBanner,


 
}