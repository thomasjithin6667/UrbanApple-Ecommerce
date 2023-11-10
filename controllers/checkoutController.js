const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const Address = require('../models/addressesModel')
const mongoose = require('mongoose')
const Coupon= require('../models/couponModel')
require("dotenv").config()
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;


const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
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



const postCheckout = async (req, res) => {
  const userId = req.session.user_id;
  const { address, payment } = req.body;

  try {
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    });

    if (!user || !cart) {
      console.error('User or cart not found.');
      return res.status(400).send('User or cart not found');
    }

    const cartItems = cart.items || [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      if (!product) {
        console.error('Product not found.');
        return res.status(400).send('Product not found');
      }

      if (product.quantity < cartItem.quantity) {
        console.error('Not enough quantity in stock.');
        return res.status(400).send('Not enough quantity in stock');
      }

      product.quantity -= cartItem.quantity;

      const shippingCost = 100;
      const itemTotal = product.discountPrice * cartItem.quantity + shippingCost;
      totalAmount += itemTotal;

      await product.save();
    }

    let orderPaymentMethod = '';

    if (payment === 'Cash on delivery') {
      orderPaymentMethod = 'Cash on delivery'; 

      const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: orderPaymentMethod,
        totalAmount: totalAmount,
        items: cartItems.map((cartItem) => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,
          price: cartItem.product.discountPrice,
        })),
      });

      await order.save();
      

      await Cart.deleteOne({ user: userId });
      const status = "cod";
      res.status(200).json({ status: status });
     
    } else if (payment === 'Online Payment') {
      orderPaymentMethod = 'Online Payment'; 
      try {


        
      const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: orderPaymentMethod,
        totalAmount: totalAmount,
        items: cartItems.map((cartItem) => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,
          price: cartItem.product.discountPrice,
        })),
      });

      await order.save();
      

      await Cart.deleteOne({ user: userId });
    

        const amount = req.body.amount*100
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'razorUser@gmail.com'
        }

        razorpayInstance.orders.create(options, 
            (err, order)=>{
                if(!err){
                    res.status(200).send({
                        success:true,
                        msg:'Order Created',
                        order_id:order.id,
                        amount:amount,
                        key_id:RAZORPAY_ID_KEY,
                        product_name:"Apple Products",
                        description:req.body.description,
                        contact:"8567345632",
                        name: "Sandeep Sharma",
                        email: "sandeep@gmail.com"
                    });
                }
                else{
                    res.status(400).send({success:false,msg:'Something went wrong!'});
                }
            }
        );

    } catch (error) {
        console.log(error.message);
    }

   
      
    } else {
      console.error('Invalid payment method selected.');
      return res.status(400).send('Invalid payment method selected');
    }
  } catch (error) {
    console.error('Error placing the order:', error);
    return res.status(500).send('Error placing the order');
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
    }

    await Order.findByIdAndUpdate({ _id: orderId }, update);
    res.redirect('/admin/orderlist');
  } catch (error) {
    console.log(error.message);
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
    console.log(couponCode);
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
    return res.json({ discountedTotal, errorMessage});
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
  try{
    const orderId = req.params.orderId;
    const canclledOrder = await Order.findById(orderId);
    if(canclledOrder.paymentMethod === 'Online Payment'){
      const canclledOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancel requested' }, { new: true });
    }else if(canclledOrder.paymentMethod === 'Cash on delivery'){
      const canclledOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true });
    }
    if (!canclledOrder) {
      return res.status(404).json({ error: 'Order not found.' });
  }
  res.redirect('/userorderlist')
  }catch(error){
    console.log("Error occoured", error);
  }
};

 const returnOrder = async(req,res) =>{
  try{
    const userId = req.session.user._id
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(orderId,  { status: 'return requested' }, { new: true });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
  }
  res.redirect('/userorderlist')
  }catch(error){
    console.log("Erorr while updating", error);
  }
  }



  async function applyCoup(couponCode,discountedTotal, userId){
    const coupon = await Coupon.findOne({code : couponCode})
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
  

  const OnlinePayment = async(req,res)=>{
    try {
        const amount = req.body.amount*100
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'razorUser@gmail.com'
        }

        razorpayInstance.orders.create(options, 
            (err, order)=>{
                if(!err){
                    res.status(200).send({
                        success:true,
                        msg:'Order Created',
                        order_id:order.id,
                        amount:amount,
                        key_id:RAZORPAY_ID_KEY,
                        product_name:req.body.name,
                        description:req.body.description,
                        contact:"8567345632",
                        name: "Sandeep Sharma",
                        email: "sandeep@gmail.com"
                    });
                }
                else{
                    res.status(400).send({success:false,msg:'Something went wrong!'});
                }
            }
        );

    } catch (error) {
        console.log(error.message);
    }
}


//razorpay gateway

const razorpayOrder= async (req, res)=>{
  try {
    const userData= await user.findOne({email:req.user});
    console.log("data  "+userData)
    console.log("cart  "+req.body.userCart)
    const userCart = await cart.findOne({userId:userData._id}).populate({
      path: "products.productId",
      model: "product",
    });
    const userAddress = await address.findOne({ userId: userData._id });
    const selected_address = req.body.selected_address;
    let orderTotal = 0;
    let orderProducts = [];
    userCart.products.forEach((product) => {
      const orderProduct = {
        productId: product.productId._id,
        price: product.productId.selling_price,
        quantity: product.quantity,
      };
      console.log("address " + req.body.selected_address);
      const userId=userData._id;
      orderTotal += orderProduct.price * orderProduct.quantity;
      orderProducts.push(orderProduct);
    });
    const newOrder = await order.create({
      userId: userData._id,
      products: orderProducts,
      orderDate: new Date(),
      orderAddress: userAddress.address[selected_address],
      totalAmount: orderTotal,
      paymentMethod:"Razorpay",
    });
    // await cart.deleteOne({ userId: userData._id });
    
    var options = {
      amount: orderTotal, 
      currency: "INR",
      receipt: newOrder._id,
    };
    razorpay.orders.create(options, function(err, order) {
      console.log(order);
      res.status(200).json({ message: "Order placed successfully.", order});
    });

  } catch (error) {
    console.error("An error occurred while placing the order: ", error);
    res.status(500).json({ error: "An error occurred while placing the order." });
  }
};

//cashondelivery

const cashOnDelivery=async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  const userId = req.session.user_id;
  const {address, payment, couponCode, coupon} = req.body
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
    if(couponCode){
      totalAmount = await applyCoup(couponCode,totalAmount, userId)
    }

    const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: payment,
        totalAmount: totalAmount,
        items: cartItems.map(cartItem => ({
            product: cartItem.product._id,
            quantity: cartItem.quantity,
            price: cartItem.product.discountPrice, 
        })),
    });

    await order.save();

    await Cart.deleteOne({ user: userId })
    const orderItems = cartItems.map((cartItem) => ({
      name: cartItem.product.name, 
      quantity: cartItem.quantity,
      price: cartItem.product.discountPrice,
    }));

    const userEmail = user.email;
    const userName = user.username;
    const orderId = order._id;
    const ordertotalAmount = totalAmount
   

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Order placed successfully."});
} catch (error) {
    console.error('Error placing the order:', error);




}
}



module.exports = {
  postCheckout,
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
  OnlinePayment,
  razorpayOrder,
  cashOnDelivery
  





}
