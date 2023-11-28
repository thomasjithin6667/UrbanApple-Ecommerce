//=====================================================================================================================================//
//CHECKOUT CONTROLLER
//=====================================================================================================================================//
//module imports
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const Address = require('../models/addressesModel')
const mongoose = require('mongoose')
const Coupon = require('../models/couponModel')
const Transaction = require('../models/transactionModel')
const Razorpay = require('razorpay');
require("dotenv").config()
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;


const razorpay = new Razorpay({
  key_id:RAZORPAY_ID_KEY,
  key_secret:  RAZORPAY_SECRET_KEY,
});

//=====================================================================================================================================//
//calculate subtotal in cart
const calculateSubtotal = (cart) => {
  let subtotal = 0;
  for (const cartItem of cart) {
      const isDiscounted = cartItem.product.discountStatus &&
          new Date(cartItem.product.startDate) <= new Date() &&
          new Date(cartItem.product.endDate) >= new Date();

      // Use discountPrice if available and within the discount period, else use regular price
      const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;

      subtotal += priceToConsider * cartItem.quantity;
  }
  return subtotal;
};

//=====================================================================================================================================//
//calculate product total in cart
const calculateProductTotal = (cart) => {
  const productTotals = [];
  for (const cartItem of cart) {
      const isDiscounted = cartItem.product.discountStatus &&
          new Date(cartItem.product.startDate) <= new Date() &&
          new Date(cartItem.product.endDate) >= new Date();

      const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;

      const total = priceToConsider * cartItem.quantity;
      productTotals.push(total);
  }
  return productTotals;
};

//=====================================================================================================================================//
//get  the checkout details
const getCheckout = async (req, res) => {
  const userId = req.session.user_id;
  try {
    const user = await User.findById(userId).exec();
    const categoryPo = await Category.find()

    if (!user) {
      console.log('User not found.');

    }

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        model: 'Product',
      })
      .exec();

    const addresses = await Address.find({ user: userId }).exec();

    if (!cart) {
      console.log('Cart not found.');

    }
    const cartItems = cart.items || [];

    const subtotal = calculateSubtotal(cartItems);
    const productotal = calculateProductTotal(cartItems);
    const subtotalWithShipping = subtotal + 100;
    const outOfStockError = cartItems.some(item => cart.quantity < item.quantity);
    const maxQuantityErr = cartItems.some(item => cart.quantity > 2);
    res.render('checkout', {
      user,
      cart: cartItems,
      subtotal,
      productotal,
      subtotalWithShipping,
      addresses,
      outOfStockError,
      maxQuantityErr,
      categoryPo
    });
  } catch (err) {
    console.error('Error fetching user data and addresses:', err);

  }
};

//=====================================================================================================================================//
//function to redirect after placing order
const orderPlaced = async (req, res) => {
  try {
    const mostRecentOrder = await Order.findOne().sort({ orderDate: -1 }).populate('address user');

    if (!mostRecentOrder) {
      console.log('No orders found');
    }

    const user = await User.findById(mostRecentOrder.user);

    res.render('orderSuccess', { order: mostRecentOrder, user });
  } catch (err) {
    console.error(err);
  }
};

//=====================================================================================================================================//
//function to get orderlist in adminside
const orderList = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const limit = 10; 

    const totalOrdersCount = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrdersCount / limit);
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    res.render('orderlist', { orders, admin, totalPages, currentPage: page });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


//=====================================================================================================================================//
//get order details in the adminside  
const orderDetails = async (req, res) => {
  try {
    const admin = req.session.adminData
    const orderId = req.query.orderId;


    const orderData = await Order.findOne({ _id: orderId })
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      })



    res.render('show-order', { order: orderData, admin: admin });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//=====================================================================================================================================//
//get the order list of the user
const userOrderlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userData = req.session.user;

    const page = parseInt(req.query.page) || 1;
    const limit = 5; 

    const totalOrdersCount = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrdersCount / limit);
    const skip = (page - 1) * limit;

    const orderData = await Order.find({ user: userId })
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    res.render('userorderlist', { orders: orderData, user: userData, totalPages, currentPage: page });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


//=====================================================================================================================================//
//change status in  the admin side
const setStatus = async (req, res) => {
  try {
    const orderStatus = req.query.status;
    const orderId = req.query.orderId;

    const update = {
      $set: { status: orderStatus },
    };

    if (orderStatus === "Delivered") {
      update.$set.deliveryDate = Date.now();
      update.$set.paymentStatus='Payment Successful'

    } else if (orderStatus === "Cancelled" || orderStatus === "Return Confirmed") {
      const orderData = await Order.findOne({ _id: orderId })
        .populate('user')
        .populate({
          path: 'items.product',
          model: 'Product',
        });

      const user = await User.findOne({ _id: orderData.user._id });

      user.walletBalance += orderData.totalAmount;
      await user.save();

      for (const item of orderData.items) {
        const product = item.product;
        product.quantity += item.quantity;
        await product.save();
      }

      update.$set.cancelledDate = Date.now();
      if(orderData.paymentMethod=="Wallet Payment" || orderData.paymentMethod=="Online Payment" && orderData.paymentStatus == "Payment Successful"){
        update.$set.paymentStatus='Payment Refuned'
      }
      else{
       
        update.$set.paymentStatus='Payment Declined'
      }
     

      const transactionCredit = new Transaction({
        user: orderData.user._id,
        amount: orderData.totalAmount,
        orderId:orderData._id,
        paymentMethod:"Wallet Payment",
        type: 'credit',
        description: `Credited to wallet for order: ${orderId}`,
      });

      await transactionCredit.save();
    }


    await Order.findByIdAndUpdate({ _id: orderId }, update);
    res.redirect('/admin/orderlist');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//=====================================================================================================================================//
//get order details in the admin side  
const userOrderDetails = async (req, res) => {
  try {
    const userData = req.session.user
    const orderId = req.query.orderId;


    const orderData = await Order.findOne({ _id: orderId })
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      })
    res.render('userOrderDetails', { order: orderData, user: userData });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//=====================================================================================================================================//
//function to apply coupon
const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const userId = req.session.user_id;
    const coupon = await Coupon.findOne({ code: couponCode });
    let errorMessage;
    
    if (!coupon) {
       errorMessage = "Coupon not found"
    }
    const currentDate = new Date();
    if ( currentDate > coupon.expiry) {
      errorMessage = "Coupon Expired"
    }

    if (coupon.usersUsed.length >= coupon.limit) {
      errorMessage = "Coupon limit Reached"
    }

    if (coupon.usersUsed.includes(userId)) {
      errorMessage = "You already used this coupon"
    }
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        model: 'Product',
      })
      .exec();
    const cartItems = cart.items || [];

    const orderTotal = calculateSubtotal(cartItems);
    let discountedTotal = 0;

    if (coupon.type === 'percentage') {
      discountedTotal = calculateDiscountedTotal(orderTotal, coupon.discount);
    } else if (coupon.type === 'fixed') {
      discountedTotal = orderTotal - coupon.discount;
    }
     res.json({ discountedTotal, errorMessage });
  } catch (error) {
    console.error('Error applying coupon: server', error);
    res.status(500).json({ error: 'An error occurred while applying the coupon.' });
  }
};

//=====================================================================================================================================//
//function to calulaate discount total
function calculateDiscountedTotal(total, discountPercentage) {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100.');
  }

  const discountAmount = (discountPercentage / 100) * total;
  const discountedTotal = total - discountAmount;

  return discountedTotal;
};

//=====================================================================================================================================//
//function to cancel order
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    let cancelledOrder = await Order.findById(orderId);

    if (!cancelledOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (cancelledOrder.paymentMethod === 'Online Payment' || cancelledOrder.paymentMethod === 'Wallet Payment') {
      await Order.findByIdAndUpdate(orderId, { status: 'Cancel requested' }, { new: true });
    } else if (cancelledOrder.paymentMethod === 'Cash on delivery') {
      cancelledOrder = await Order.findOne({ _id: orderId })
        .populate('user')
        .populate({
          path: 'items.product',
          model: 'Product',
        });


      await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true });

      for (const item of cancelledOrder.items) {
        const product = item.product;
        product.quantity += item.quantity;
        await product.save();
      }
    }

    res.redirect('/userorderlist');
  } catch (error) {
    console.log("Error occurred", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//=====================================================================================================================================//
//function to return order by user
const returnOrder = async (req, res) => {
  try {
    const userId = req.session.user._id
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(orderId, { status: 'Return requested' }, { new: true });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.redirect('/userorderlist')
  } catch (error) {
    console.log("Erorr while updating", error);
  }
};

//=====================================================================================================================================//
//function to apply coupon
async function applyCoup(couponCode, discountedTotal, userId) {
  const coupon = await Coupon.findOne({ code: couponCode })
  if (!coupon) {
    return { error: 'Coupon not found.' }
  }
  const currentDate = new Date();
  if (currentDate > coupon.expiry) {
    return { error: 'Coupon has expired.' }
  }
  if (coupon.usersUsed.length >= coupon.limit) {
    return { error: 'Coupon limit reached.' };
  }

  if (coupon.usersUsed.includes(userId)) {
    return { error: 'You have already used this coupon.' }
  }
  if (coupon.type === 'percentage') {
    discountedTotal = calculateDiscountedTotal(discountedTotal, coupon.discount);
  } else if (coupon.type === 'fixed') {
    discountedTotal = discountedTotal - coupon.discount;
  }
  coupon.limit--
  coupon.usersUsed.push(userId);
  await coupon.save();
  return discountedTotal;
};



//=====================================================================================================================================//
//function to place order uisng razorpay gateway
const razorpayOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { address, couponCode } = req.body;


    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    });

    if (!user || !cart) {
      throw new Error('User or cart not found.');
    }

    const cartItems = cart.items || [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      if (!product) {
        throw new Error('Product not found.');
      }

      if (product.quantity < cartItem.quantity) {
        throw new Error('Not enough quantity in stock.');
      }

      product.quantity -= cartItem.quantity;

      const shippingCost = 100;
      const itemTotal = product.discountPrice * cartItem.quantity + shippingCost;
      totalAmount += itemTotal;

      await product.save();
    }

    if (couponCode) {
      totalAmount = await applyCoup(couponCode, totalAmount, userId);
    }

    const order = new Order({
      user: userId,
      address: address,
      orderDate: new Date(),
      status: 'Pending',
      paymentMethod: 'Online Payment',
      paymentStatus: 'Payment Pending',
      totalAmount: totalAmount,
      items: cartItems.map(cartItem => ({
        product: cartItem.product._id,
        quantity: cartItem.quantity,
        price: cartItem.product.discountPrice,
      })),
    });

    await order.save();
   

    const options = {

      amount: totalAmount,
      currency: 'INR',
      receipt: order._id,
    };

    razorpay.orders.create(options, async (err, razorpayOrder) => {
      if (err) {
        console.error('Error creating Razorpay order:', err);
        res.status(500).json({ error: 'An error occurred while placing the order.' });
      } else {
        
        res.status(200).json({ message: 'Order placed successfully.', order: razorpayOrder });
      }
    });
  } catch (error) {
    console.error('An error occurred while placing the order: ', error);
    res.status(500).json({ error: 'An error occurred while placing the order.' });
  }
};

//=====================================================================================================================================//
//function to place order using cashondelivery
const cashOnDelivery = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const userId = req.session.user_id;
  const { address, couponCode } = req.body;

  try {
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    });

    if (!user || !cart) {
      throw new Error('User or cart not found.');
    }

    const cartItems = cart.items || [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      if (!product) {
        throw new Error('Product not found.');
      }

      if (product.quantity < cartItem.quantity) {
        throw new Error('Not enough quantity in stock.');
      }
      let couponResult = { error: '', discountedTotal: totalAmount };

      if (couponCode) {
        totalAmount = await applyCoup(couponCode, totalAmount, userId);
        if (couponResult.error) {
          return res.status(400).json({ error: couponResult.error });
        }
      }

    

      const isDiscounted = product.discountStatus &&
          new Date(product.startDate) <= new Date() &&
          new Date(product.endDate) >= new Date();

      const priceToConsider = isDiscounted ? product.discountPrice : product.price;

      product.quantity -= cartItem.quantity;

      const shippingCost = 100;
      const itemTotal = priceToConsider * cartItem.quantity + shippingCost;
      totalAmount += itemTotal;

      await product.save();
    }

 

    const order = new Order({
      user: userId,
      address: address,
      orderDate: new Date(),
      status: 'Pending',
      paymentMethod: 'Cash on delivery',
      paymentStatus: 'Payment Pending',
      totalAmount: totalAmount,
      items: cartItems.map(cartItem => {
        const product = cartItem.product;
        const isDiscounted = product.discountStatus &&
          new Date(product.startDate) <= new Date() &&
          new Date(product.endDate) >= new Date();
        const priceToConsider = isDiscounted ? product.discountPrice : product.price;
    
        return {
          product: product._id,
          quantity: cartItem.quantity,
          price: priceToConsider,
        };
      }),
    });
    

    await order.save();

    await Cart.deleteOne({ user: userId });

    const orderItems = cartItems.map(cartItem => ({
      name: cartItem.product.name,
      quantity: cartItem.quantity,
      price: cartItem.product.discountPrice,
    }));

   
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Order placed successfully.' });
  } catch (error) {
    console.error('Error placing the order:', error);

    await session.abortTransaction();
    session.endSession();

    let errorMessage = 'Error occurred while placing order.';
    if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ success: false, message: errorMessage, error: error.message });
  }
};

//=====================================================================================================================================//
//function to place order using walletpayment
const walletPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const userId = req.session.user_id;
  const { address, couponCode } = req.body;
  console.log(couponCode);

  try {
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    });

    if (!user || !cart) {
      throw new Error('User or cart not found.');
    }

    const cartItems = cart.items || [];
    let totalAmount = 0;



    if (couponCode) {
      totalAmount = await applyCoup(couponCode, totalAmount, userId);
    }

    if (user.walletBalance < totalAmount) {
      throw new Error('Insufficient funds in the wallet.');
    }
    for (const cartItem of cartItems) {
      const product = cartItem.product;

      if (!product) {
        throw new Error('Product not found.');
      }

      if (product.quantity < cartItem.quantity) {
        throw new Error('Not enough quantity in stock.');
      }

      product.quantity -= cartItem.quantity;

      const shippingCost = 100;
      const itemTotal = product.discountPrice * cartItem.quantity + shippingCost;
      totalAmount += itemTotal;

      await product.save();
    }

    user.walletBalance -= totalAmount;
    await user.save();

    const order = new Order({
      user: userId,
      address: address,
      orderDate: new Date(),
      status: 'Pending',
      paymentMethod: 'Wallet Payment',
      paymentStatus:'Payment Successful',
      totalAmount: totalAmount,
      items: cartItems.map(cartItem => ({
        product: cartItem.product._id,
        quantity: cartItem.quantity,
        price: cartItem.product.discountPrice,
      })),
    });

    await order.save();


    const transactiondebit = new Transaction({
      user: userId,
      amount : totalAmount,
      orderId:order._id,
      paymentMethod: 'Wallet Payment',
      type: 'debit', 
      description : `Debited from wallet for order : ${order._id}`
    });
    await transactiondebit.save();
    
    await Cart.deleteOne({ user: userId });

    const orderItems = cartItems.map(cartItem => ({
      name: cartItem.product.name,
      quantity: cartItem.quantity,
      price: cartItem.product.discountPrice,
    }));

    const userEmail = user.email;
    const userName = user.username;
    const orderId = order._id;
    const ordertotalAmount = totalAmount;

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Order placed successfully.' });
  } catch (error) {
    console.error('Error placing the order:', error);

    await session.abortTransaction();
    session.endSession();

    let errorMessage = 'Error occurred while placing order.';
    if (error.message) {
        errorMessage = error.message; 
    }

    res.status(500).json({ success: false, message: errorMessage, error: error.message });
}
};

//=====================================================================================================================================//
//uppdate payemnt status after online payment 
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    const recentOrder = await Order.findOne().sort({ orderDate: -1 });

    if (!recentOrder) {
      return res.status(404).json({ error: 'No recent orders found' });
    }

    recentOrder.paymentStatus = status;
    recentOrder.paymentTransactionId = paymentId;
    recentOrder.paymentDate = new Date();

    const updatedOrder = await recentOrder.save();

    const transactionCredit = new Transaction({
      user: recentOrder.user._id,
      amount: recentOrder.totalAmount,
      orderId:recentOrder._id,
      paymentMethod:"Online Payment",
      type: 'debit',
      description: `Debited from Bank account for order: ${recentOrder._id}`,
    });
    await transactionCredit.save();
    await Cart.deleteOne({ user: recentOrder.user._id });

    return res.status(200).json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
//=====================================================================================================================================//


module.exports = {

  getCheckout,
  orderPlaced,
  orderList,
  orderDetails,
  setStatus,
  userOrderlist,
  userOrderDetails,
  applyCoupon,
  cancelOrder,
  returnOrder,
  razorpayOrder,
  cashOnDelivery,
  walletPayment,
  updatePaymentStatus
}

//=====================================================================================================================================//
//=====================================================================================================================================//
