const User = require('../models/userModel');
const UserOTPVerification = require('../models/userOTPModel')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Coupon = require('../models/couponModel')





const getCoupon = (req, res)=>{
  const admin=  req.session.adminData
    res.render('couponAdd',{admin:admin})
  }

 const viewCoupon =async (req, res)=>{
    try{
      const admin=  req.session.adminData
      const coupons = await Coupon.find()
      res.render('viewCoupon',{coupons,admin:admin})
    }catch(err){
      console.log("Error occoured while fetching coupons", err);
    }
  }

 const postAddCoupon = async (req, res) =>{
    const {couponCode, discount, expiryDate, limit, DiscountType} = req.body;
    try{
    
      const newCoupon = new Coupon ({
        code : couponCode,
        discount : discount,
        limit : limit,
        type : DiscountType,
        expiry : expiryDate
      })
      await Coupon.insertMany(newCoupon);
      res.redirect('viewCoupon')
    }catch(err){
      console.log("Error adding coupon", err);
    }
  }



 const viewCouponUsedUsers = async (req, res)=>{
    try{
      const admin=  req.session.adminData
      const couponId = req.params.couponId;
      const coupon = await Coupon.findById(couponId)
      .populate('usersUsed') 
      .sort({ _id: -1 })
      .exec();    
      const users = coupon.usersUsed;
      res.render('viewCouponUsers', {users, coupon,admin:admin});
    }catch(err){
      console.log("Error finding the coupon code", err);
    } 
  }



   const getAvailableCoupons = async (req, res)=>{
    try {
      const currentDate = new Date();
      const userData = await User.findById({ _id: req.session.user_id })
  
      const availableCoupons = await Coupon.find({
        expiry: { $gt: currentDate }, 
        limit: { $gt: 0 }, 
      });
  
      res.render('availableCoupons', {availableCoupons,user:userData})
    } catch (error) {
  
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  


  //list and unlist category

const unlistCoupon = async (req, res) => {
  try {
      const id = req.query.id;


      const coupon = await Coupon.findById(id);



      coupon.isListed = !coupon.isListed;


      await coupon.save();

      res.redirect('/admin/viewCoupon');
  } catch (error) {
      console.log(error.message);


  }
}





  module.exports = {
     getCoupon,
     viewCoupon,
     postAddCoupon,
     viewCouponUsedUsers,
     getAvailableCoupons,
     unlistCoupon
 
}