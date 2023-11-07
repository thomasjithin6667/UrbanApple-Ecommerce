
//import statements
const Cart = require('../models/cartModel'); 
const User=require('../models/userModel');
const Product = require('../models/productModel')
const Wishlist=require('../models/wishlistModel')




//add to cart
// const addtocartd = async (req, res) => {
//     try {
//         const userId = req.session.user._id;
//         const productId = req.params.productId;
//         const {qty} = req.body;

//         const existingCart = await Cart.findOne({user: userId});
//         let newCart = {}

//         if (existingCart) {
//             const existingCartItem = existingCart.items.find(item => item.product.toString() === productId);

//             if (existingCartItem){
//                 existingCartItem.quantity += parseInt(qty);
//             } else {
//                 existingCart.items.push({product: productId, quantity: parseInt(qty)});
//             }

//             existingCart.total = existingCart.items.reduce((total, item) => total + (item.quantity || 0), 0)

//             await existingCart.save();
//         } else {
//             newCart = new Cart({
//                 user: userId,
//                 items: [{product: productId, quantity: parseInt(qty)}],
//                 total: parseInt(qty,10),
//             });

//             await newCart.save()
//         }

//         req.session.cartLength = (existingCart || newCart).items.length

//         res.redirect('/productlist')
//     } catch (error) {
//         console.error('Error adding product to cart:', error);
     
//     }
// };



const addtocart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const productId = req.params.productId;
        const { qty } = req.body;

        const existingCart = await Cart.findOne({ user: userId });
        let newCart = {};

        if (existingCart) {
            const existingCartItem = existingCart.items.find(item => item.product.toString() === productId);

            if (existingCartItem) {
                existingCartItem.quantity += parseInt(qty);
            } else {
                existingCart.items.push({ product: productId, quantity: parseInt(qty) });
            }

            existingCart.total = existingCart.items.reduce((total, item) => total + (item.quantity || 0), 0);

            await existingCart.save();
        } else {
            newCart = new Cart({
                user: userId,
                items: [{ product: productId, quantity: parseInt(qty) }],
                total: parseInt(qty, 10),
            });

            await newCart.save();
        }

        const userWishlist = await Wishlist.findOne({ user: userId });
        if (userWishlist) {
            const wishlistItemIndex = userWishlist.items.findIndex(item => item.product.toString() === productId);
            if (wishlistItemIndex !== -1) {
                userWishlist.items.splice(wishlistItemIndex, 1);
                await userWishlist.save();
            }
        }

        req.session.cartLength = (existingCart || newCart).items.length;

        res.redirect('/productlist');
    } catch (error) {
        console.error('Error adding product to cart:', error);
    }
};


//function to calculate total price
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


  



//To load the cart
const getcart = async (req, res) => {
    const userId = req.session.user_id;

    try {
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');

        const cart = userCart ? userCart.items : []; 
        const subtotal = calculateSubtotal(cart);
        const productotal = calculateProductTotal(cart);
        const subtotalWithShipping = subtotal + 100
      
        
        let outOfStockError =false;

        if (cart.length > 0) {
            for (const cartItem of cart) {
                const product = cartItem.product;
        
                if (product.quantity<cartItem.quantity) {
                    outOfStockError = true;
                    break;
                }
            }
        }
        let maxQuantityErr = false;
        if (cart.length > 0) {
            for (const cartItem of cart) {
                const product = cartItem.product;
        
                if (cartItem.quantity > 2) {
                    maxQuantityErr = true;
                    break;
                }
            }
        }


        res.render('cart', { user: req.session.user,cart,subtotal,outOfStockError,maxQuantityErr,productotal,subtotalWithShipping});
    } catch (err) {
        console.error('Error fetching user cart:', err);
     
    }
};


//to delete item in cart

 const deleteCart = async (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.productId;
  
    try {
        const userCart = await Cart.findOne({user: userId});
  
        if (!userCart) {
            return res.status(404).json({error: 'User cart not found.'});
        }
  
        const cartItemIndex = userCart.items.findIndex((item) =>
            item.product.equals(productId)
        );
  
        if (cartItemIndex === -1) {
            return res.status(404).json({error: 'Product not found in cart.'});
        }
  
        userCart.items.splice(cartItemIndex, 1);
        await userCart.save();
  
       
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: 'An error occurred while removing item from cart.' });
    }
  };


  //update cart quantity
   const updateQuantity = async (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.productId;
    const newQuantity = req.body.quantity;
  
    try {
        
        const maxQuantity = 3;
  
        const userCart = await Cart.findOne({ user: userId });
  
        if (!userCart) {
            return res.status(404).json({ error: 'User cart not found.' });
        }
  
        const cartItem = userCart.items.find((item) =>
            item.product.equals(productId)
        );
  
        if (!cartItem) {
            return res.status(404).json({ error: 'Product not found in cart.' });
        }
  
    
        if (newQuantity >= 0 && newQuantity <= 4) {
            cartItem.quantity = newQuantity;
            await userCart.save();
            res.sendStatus(200);
        } else {
            res.status(400).json({ error: `Quantity must be between 0 and ${maxQuantity}.` });
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ error: 'An error occurred while updating quantity.' });
    }
  };


module.exports = {
    addtocart,
    getcart,
    deleteCart,
    updateQuantity 
 
}



