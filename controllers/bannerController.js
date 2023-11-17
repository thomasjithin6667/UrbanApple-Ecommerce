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
    const productData =await Product.find({})
      const admin=  req.session.adminData
      const { title, link, subtitle, position, isListed, product} = req.body;
     
      
      if (!req.file) {
      
          return res.render('banner-add', { admin:admin,message: 'Banner image is required',product:productData });
      }

      const image = req.file.filename;

      const newBanner = new Banner({
          title,
          image,
          link,
          subtitle,
          position,
          isListed: isListed || true,
          product
      });

     await newBanner.save();
      return res.render('banner-add', { admin:admin,message: "Banner added succesfully",product:productData  });
  } catch (error) {
      console.error(error);
      const admin=  req.session.adminData
      const productData =await Product.find({})
   
      return res.render('banner-add', { admin:admin, error: 'An error occurred while adding the banner',product:productData  });
  }
};


const editBanner = async (req, res) => {
  try {
    const { id } = req.query; // Assuming the banner ID is passed as a query parameter
    const productData = await Product.find({});
    const admin = req.session.adminData;
    const { title, link, subtitle, position, isListed, product } = req.body;

    if (!req.file) {
      return res.render('banner-edit', {
        admin: admin,
        message: 'Banner image is required for editing',
        product: productData
      });
    }

    const image = req.file.filename;

    // Logic to update banner details along with the image
    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      {
        title,
        image,
        link,
        subtitle,
        position,
        isListed: isListed || true,
        product
      },
      { new: true }
    );

    return res.render('banner-edit', {
      admin: admin,
      message: 'Banner details and image updated successfully',
      banner: updatedBanner,
      product: productData
    });
  } catch (error) {
    console.error(error);
    const admin = req.session.adminData;
    const productData = await Product.find({});

    return res.render('banner-edit', {
      admin: admin,
      error: 'An error occurred while editing the banner',
      product: productData
    });
  }
};

const loadAddBanner=  async(req, res)=>{
    const admin=  req.session.adminData
    const product =await Product.find({})

    res.render('banner-add',{admin:admin,product:product})
}


const loadEditBanner = async (req, res) => {
  try {
    const BannerId = req.query.id;
   

    const banner = await Banner.findById(BannerId).populate('product');
    const admin = req.session.adminData;
    const product = await Product.find({});
    console.log(BannerId,banner);

    res.render('banner-edit', { banner, admin, product });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};






const loadBannerList = async (req, res)=>{
    const admin=  req.session.adminData
    const banner = await Banner.find().populate('product')
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
    editBanner


 
}