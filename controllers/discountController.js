//=====================================================================================================================================//
//DISCOUNT OFFER CONTROLLER
//=====================================================================================================================================//
//module imports

const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Discount = require('../models/discountModel');

//=====================================================================================================================================//
//function to load the offer list page in the admin side
const loadOfferList = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const limit = 5; 

    const totalOffersCount = await Discount.countDocuments();
    const totalPages = Math.ceil(totalOffersCount / limit);
    const skip = (page - 1) * limit;

    const offer = await Discount.find()
      .skip(skip)
      .limit(limit);

    res.render('offer-list', { offer, admin, totalPages, currentPage: page });
  } catch (error) {
    console.error('Error fetching offer list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


//=====================================================================================================================================//
//function to load page to add offer
  const loadAddOffer = async (req, res) => {
    const admin = req.session.adminData
    const product = await Product.find({})
    const categoryData = await Category.find({})
  
    res.render('offer-add', { admin: admin, product: product, category: categoryData })
  };

//=====================================================================================================================================//
//function to add offer 
  const addOffer = async (req, res) => {
    const admin = req.session.adminData;
    const product = await Product.find({});
    const categoryData = await Category.find({});
  
    try {
      const {
        name,
        discountOn,
        discountType,
        discountValue,
        maxRedeemableAmt,
        startDate,
        endDate,
 
        discountedProduct,
        discountedCategory,
      } = req.body;
  
      const existingNameOffer = await Discount.findOne({ name });
      const existingCategoryOffer = await Discount.findOne({ discountedCategory });
      const existingProductOffer = await Discount.findOne({ discountedProduct });

      if (existingNameOffer) {
        return res.render('offer-add', { admin, product, category: categoryData, message: 'Duplicate Discount Name not allowed.' });
      }
  
      if (discountedCategory && existingCategoryOffer) {
        return res.render('offer-add', { admin, product, category: categoryData, message: 'An offer for this category already exists.' });
      }
  
      if (discountedProduct && existingProductOffer) {
        return res.render('offer-add', { admin, product, category: categoryData, message: 'An offer for this product already exists.' });
      }
  
      const newOffer = new Discount({
        name,
        discountOn,
        discountType,
        discountValue,
        maxRedeemableAmt,
        startDate,
        endDate,
        discountedProduct,
        discountedCategory,
      });
      await newOffer.save();

      if (discountedProduct) {
        const discountedProductData = await Product.findById(discountedProduct);
  
        let discount = 0;
        if (discountType ==='percentage') {
          discount = (discountedProductData.price * discountValue) / 100;
        } else if (discountType === 'fixed Amount') {
          discount = discountValue;
        }
  
        await Product.updateOne(
          { _id: discountedProduct },
          {
            $set: {
              discountPrice: calculateDiscountPrice(
                discountedProductData.price,
                discountType,
                discountValue
              ),
              discount,
              startDate,
              endDate,
              discount: discount,
              discountStatus:true
            },
          }
        );
      } else if (discountedCategory) {
        await Category.updateOne(
          { _id: discountedCategory },
          {
            $set: {
              discountType,
              discountValue,
              startDate,
              endDate,
              discountStatus:true
            },
          }
        );
      }
  
      res.redirect('/admin/offer-list');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

//=====================================================================================================================================//
//functon to edit offer
  const editOffer = async (req, res) => {
    const admin = req.session.adminData;
    const product = await Product.find({});
    const categoryData = await Category.find({});
  
    try {
      const {
        name,
        discountOn,
        discountType,
        discountValue,
        maxRedeemableAmt,
        startDate,
        endDate,
        
        discountedProduct,
        discountedCategory,
      } = req.body;
  
      const offerId = req.query.id;
  
      const existingOffer = await Discount.findById(offerId);
  
      if (!existingOffer) {
        return res.render('error-page', { message: 'Offer not found.' });
      }

      if (name !== existingOffer.name) {
        const existingNameOffer = await Discount.findOne({ name });
        if (existingNameOffer) {
          return res.render('offer-edit', { 
            admin, 
            product, 
            category: categoryData, 
            message: 'Duplicate Discount Name not allowed.' 
          });
        }
      }
  
      existingOffer.name = name;
      existingOffer.discountOn = discountOn;
      existingOffer.discountType = discountType;
      existingOffer.discountValue = discountValue;
      existingOffer.maxRedeemableAmt = maxRedeemableAmt;
      existingOffer.startDate = startDate;
      existingOffer.endDate = endDate;
      
      existingOffer.discountedProduct = discountedProduct;
      existingOffer.discountedCategory = discountedCategory;
  
      await existingOffer.save();
  
      if (discountedProduct) {
        const discountedProductData = await Product.findById(discountedProduct);
  
        let discount = 0;
        if (discountType === 'percentage') {
          discount = (discountedProductData.price * discountValue) / 100;
        } else if (discountType === 'fixed Amount') {
          discount = discountValue;
        }
  
        await Product.updateOne(
          { _id: discountedProduct },
          {
            $set: {
              discountPrice: calculateDiscountPrice(
                discountedProductData.price,
                discountType,
                discountValue
              ),
              discount,
              startDate,
              endDate,
              discount: discount,
              discountStatus:true
            },
          }
        );
      } else if (discountedCategory) {
        await Category.updateOne(
          { _id: discountedCategory },
          {
            $set: {
              discountType,
              discountValue,
              startDate,
              endDate,
              discountStatus:true
            },
          }
        );
      }
  
      res.redirect('/admin/offer-list');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

//=====================================================================================================================================//
//function to calculate dicount price of the product
function calculateDiscountPrice(originalPrice, discountType, discountValue) {
    if (discountType === 'fixed Amount') {

      return originalPrice - discountValue;
    } else if (discountType === 'percentage') {

      const discountAmount = (originalPrice * discountValue) / 100;
      return originalPrice - discountAmount;
    } else {

      throw new Error('Invalid discount type');
    }
  };

//=====================================================================================================================================//  
//function to load edit offer page
  const loadEditOffer = async (req, res) => {
    const admin = req.session.adminData
    const product = await Product.find({})
    const categoryData = await Category.find({})
    const offerId = req.query.id;
    const offer = await Discount.findById(offerId).populate('discountedProduct');
    const startDate = new Date(offer.startDate).toISOString().split('T')[0];
    const endDate = new Date(offer.endDate).toISOString().split('T')[0]
  
    res.render('offer-edit', { admin: admin, product: product, category: categoryData,offer:offer,startDate,endDate })
  };

//=====================================================================================================================================//
//toggle function to list and unlist offer
  const unlistOffer = async (req, res) => {
    try {
      const id = req.query.id;
  
      const offer = await Discount.findById(id);
  
      offer.isActive = !offer.isActive;
  
      if (offer.discountedProduct) {
        const discountedProduct = await Product.findById(offer.discountedProduct);
        if (discountedProduct) {
          discountedProduct.discountStatus = !discountedProduct.discountStatus;
          await discountedProduct.save();
        }
      } else if (offer.discountedCategory) {
        const discountedCategory = await Category.findById(offer.discountedCategory);
        if (discountedCategory) {
          discountedCategory.discountStatus = !discountedCategory.discountStatus;
          await discountedCategory.save();
        }
      }
  
      await offer.save();
  
      res.redirect('/admin/offer-list');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Error occurred while processing the request');
    }
  };

//=====================================================================================================================================//  
//module exports
module.exports = {
    loadOfferList,
    loadAddOffer,
    addOffer,
    loadEditOffer,
    editOffer,
    unlistOffer

}
//=====================================================================================================================================//
//=====================================================================================================================================//