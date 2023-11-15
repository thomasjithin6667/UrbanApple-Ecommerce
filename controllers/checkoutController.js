const User = require('../models/userModel');
const Product = require('../models/productModel')
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
  key_id: 'rzp_test_gwxVdrdkgotQGE',
  key_secret: '43YWiWwqPSvjiajhW7sjSItZ',
});

const calculateSubtotal = (cart) => {
  let subtotal = 0;
  for (const cartItem of cart) {
    subtotal += cartItem.product.discountPrice * cartItem.quantity;
  }
  return subtotal;
};


const calculateProductTotal = (cart) => {
  const productTotals = [];
  for (const cartItem of cart) {
    const total = cartItem.product.discountPrice * cartItem.quantity;
    productTotals.push(total);
  }
  return productTotals;
};


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





const createRazorpayOrder = async (amount) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: amount * 100,
      currency: 'INR',
    };

    razorpay.orders.create(options, (error, order) => {
      if (error) {
        reject(error);
      } else {
        resolve(order);
      }
    });
  });
};







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




const orderList = async (req, res) => {
  try {
    const admin = req.session.adminData

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
      .sort({ orderDate: -1 });
    res.render('orderlist', { orders, admin: admin });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



//get order details in the admin side  
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




//get the order list of the user
const userOrderlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userData = req.session.user



    const orderData = await Order.find({ user: userId })
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      }).sort({ orderDate: -1 })



    res.render('userorderlist', { orders: orderData, user: userData });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};







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
    } else if (orderStatus === "Cancelled" || orderStatus === "Returned") {
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

      const transactionCredit = new Transaction({
        user: orderData.user._id,
        amount: orderData.totalAmount,
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



const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const userId = req.session.user_id;
    const coupon = await Coupon.findOne({ code: couponCode });
    let errorMessage;
    if (!coupon) {
      return errorMessage = "Coupon not found"
    }
    const currentDate = new Date();
    if (coupon.expiryDate && currentDate > coupon.expiryDate) {
      return errorMessage = "Coupon Expired"
    }

    if (coupon.usersUsed.length >= coupon.limit) {
      return errorMessage = "Coupon limit Reached"
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
    return res.json({ discountedTotal, errorMessage });
  } catch (error) {
    console.error('Error applying coupon: server', error);
    return res.status(500).json({ error: 'An error occurred while applying the coupon.' });
  }
};

function calculateDiscountedTotal(total, discountPercentage) {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100.');
  }

  const discountAmount = (discountPercentage / 100) * total;
  const discountedTotal = total - discountAmount;

  return discountedTotal;
}



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

      // Update status to 'Cancelled'
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
}



async function applyCoup(couponCode, discountedTotal, userId) {
  const coupon = await Coupon.findOne({ code: couponCode })
  if (!coupon) {
    return res.status(404).json({ error: 'Coupon not found.' });
  }
  const currentDate = new Date();
  if (coupon.expiryDate && currentDate > coupon.expiryDate) {
    return res.status(400).json({ error: 'Coupon has expired.' });
  }
  if (coupon.usersUsed.length >= coupon.limit) {
    return res.status(400).json({ error: 'Coupon limit reached.' });
  }

  if (coupon.usersUsed.includes(userId)) {
    return res.status(400).json({ error: 'You have already used this coupon.' });
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
}





//razorpay gateway

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
    await Cart.deleteOne({ user: userId });

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


//cashondelivery
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
      paymentMethod: 'Cash on delivery',
      paymentStatus: 'Payment Pending',
      totalAmount: totalAmount,
      items: cartItems.map(cartItem => ({
        product: cartItem.product._id,
        quantity: cartItem.quantity,
        price: cartItem.product.discountPrice,
      })),
    });

    await order.save();

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

    res.status(200).json({ success: true, message: "Order placed successfully." });
  } catch (error) {
    console.error('Error placing the order:', error);
    
    if (error.message === 'Not enough quantity in stock.') {
      res.status(400).json({ success: false, message: "Not enough quantity in stock. Please adjust your cart." });
    } else {
      res.status(500).json({ success: false, message: "Error occurred while placing order." });
    }
  }
};



//walletpayment
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

    if (user.walletBalance < totalAmount) {
      throw new Error('Insufficient funds in the wallet.');
    }

    user.walletBalance -= totalAmount;
    await user.save();

    const order = new Order({
      user: userId,
      address: address,
      orderDate: new Date(),
      status: 'Pending',
      paymentMethod: 'Wallet Payment',
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

    res.status(500).json({ success: false, message: 'Error occurred while placing order.' });
  }
};


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

    return res.status(200).json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


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
