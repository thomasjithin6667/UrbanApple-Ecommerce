//=====================================================================================================================================//
//COUPON CONTROLLER
//=====================================================================================================================================//
//module imports

const User = require('../models/userModel');
const Coupon = require('../models/couponModel')

//=====================================================================================================================================//
//function to get add coupon form
const getCoupon = (req, res)=>{
  const admin=  req.session.adminData
    res.render('coupon-add',{admin:admin})
  };

//=====================================================================================================================================//
//function to get coupon list in adminside
const viewCoupon = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const totalCouponsCount = await Coupon.countDocuments();
    const totalPages = Math.ceil(totalCouponsCount / limit);
    const skip = (page - 1) * limit;

    const coupons = await Coupon.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdDate: -1 })

    res.render('coupon-list', { coupons, admin, totalPages, currentPage: page });
  } catch (err) {
    console.log("Error occurred while fetching coupons", err);
  
    res.status(500).send('Internal Server Error');
  }
};

//=====================================================================================================================================//
//function to add coupon on the admin side
  const postAddCoupon = async (req, res) => {
    const admin = req.session.adminData;
    let { couponCode, discount, expiryDate, limit, DiscountType,maxRedeemableAmt,minCartAmt} = req.body;
    

    couponCode = couponCode.replace(/\s/g, '');
  
    console.log(req.body);
    console.log(couponCode);
  
    try {
      if (!couponCode) {
        return res.render('coupon-add', { message: "Coupon code cannot be empty", admin: admin });
      }
  

      const existingCoupon = await Coupon.findOne({ code: { $regex: new RegExp('^' + couponCode, 'i') } });
  
      if (existingCoupon) {
        return res.render('coupon-add', { message: "Coupon code already exists", admin: admin });
      }
  
      const newCoupon = new Coupon({
        code: couponCode,
        discount: discount,
        limit: limit,
        type: DiscountType,
        expiry: expiryDate,
        maxRedeemableAmt:maxRedeemableAmt,
        minCartAmt:minCartAmt

      });
  
      await newCoupon.save();
      res.redirect('/admin/viewCoupon');
    } catch (err) {
      console.log("Error adding coupon", err);
      res.status(500).send("Error adding coupon");
    }
  };

//=====================================================================================================================================//  
//function to display coupon details on admin side  
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
  };

//=====================================================================================================================================//
  //function to get available coupon on the user side
   const getAvailableCoupons = async (req, res)=>{
    try {
      const currentDate = new Date();
      const userData = await User.findById({ _id: req.session.user_id })
  
      const availableCoupons = await Coupon.find({
        expiry: { $gt: currentDate }, 
        limit: { $gt: 0 }, 
      }) .sort({ createdDate: -1 });
  
      res.render('availableCoupons', {availableCoupons,user:userData})
    } catch (error) {
  
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

//=====================================================================================================================================//  
//toggle function to list and unlist coupon  
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
};

//=====================================================================================================================================//
//function to edit coupon
const editCoupon = async (req, res) => {
  const admin = req.session.adminData;
  const { couponId } = req.query;
  console.log(couponId);
  const coupon = await Coupon.findOne({ _id: couponId });
  const endDate = new Date(coupon.expiry).toISOString().split('T')[0]
  try {
  
    let { couponCode, discount, expiryDate, limit, DiscountType,maxRedeemableAmt,minCartAmt } = req.body;

    couponCode = couponCode.trim();

    if (!couponCode) {
      return res.render('coupon-edit', { message: "Coupon code cannot be empty", admin ,coupon,endDate});
    }

    const existingCoupon = await Coupon.findOne({ _id: couponId });

    if (!existingCoupon) {
      return res.render('coupon-edit', { message: "Coupon not found", admin,coupon,endDate });
    }

    if (couponCode) {
      existingCoupon.code = couponCode;
    }
    if (discount) {
      existingCoupon.discount = discount;
    }
    if (expiryDate) {
      existingCoupon.expiry = expiryDate;
    }
    if (limit) {
      existingCoupon.limit = limit;
    }
    if (DiscountType) {
      existingCoupon.type = DiscountType;
    }
    if (maxRedeemableAmt) {
      existingCoupon.maxRedeemableAmt = maxRedeemableAmt;
    }
    if (minCartAmt) {
      existingCoupon.minCartAmt = minCartAmt;
    }
   

    await existingCoupon.save();
    res.redirect('/admin/viewCoupon');
  } catch (err) {
    console.error("Error editing coupon", err);
    res.status(500).send("Error editing coupon");
  }
};

//=====================================================================================================================================//
//function to get edit coupon page
const getEditCoupon= async(req, res)=>{
  try {
    const admin=  req.session.adminData
    const { couponId } = req.query;
    const coupon = await Coupon.findOne({ _id: couponId });
    const endDate = new Date(coupon.expiry).toISOString().split('T')[0]
  
      res.render('coupon-edit',{admin:admin,coupon:coupon,endDate })
    
  } catch (error) {
    console.log(error.message);
    
  }
  

  }

//=====================================================================================================================================//  



  module.exports = {
     getCoupon,
     viewCoupon,
     postAddCoupon,
     viewCouponUsedUsers,
     getAvailableCoupons,
     unlistCoupon,
     editCoupon,
     getEditCoupon
 
}
//=====================================================================================================================================//
//=====================================================================================================================================//