//=====================================================================================================================================//
//CART CONTROLLER
//=====================================================================================================================================//
//import statements
const Cart = require('../models/cartModel'); 
const Wishlist=require('../models/wishlistModel')

//=====================================================================================================================================//
//function to add items to cart


const  addtocart = async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user._id) {
            return res.status(401).json({ success: false, message: 'Please log in to add a product to cart' });
        }
        const userId = req.session.user._id;
        const productId = req.params.productId;
        const { qty } = req.body;

        const existingCart = await Cart.findOne({ user: userId });

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
            const newCart = new Cart({
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

        req.session.cartLength = (existingCart ).items.length;
      

        res.status(200).json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ success: false, message: 'Failed to add product to cart' });
    }
};




//=====================================================================================================================================//
//function to calculate total price
const calculateSubtotal = (cart) => {
    let subtotal = 0;
    for (const cartItem of cart) {

        const isDiscounted = cartItem.product.discountStatus &&
            new Date(cartItem.product.startDate) <= new Date() &&
            new Date(cartItem.product.endDate) >= new Date();

        const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;

        subtotal += priceToConsider * cartItem.quantity;
    }
    return subtotal;
};

//=====================================================================================================================================//
//fucntion to calcualte product price
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

//=====================================================================================================================================//
//to delete item in cart
//  const deleteCart = async (req, res) => {
//     const userId = req.session.user._id;
//     const productId = req.params.productId;
  
//     try {
//         const userCart = await Cart.findOne({user: userId});
  
//         if (!userCart) {
//             return res.status(404).json({error: 'User cart not found.'});
//         }
  
//         const cartItemIndex = userCart.items.findIndex((item) =>
//             item.product.equals(productId)
//         );

        
  
//         if (cartItemIndex === -1) {
//             return res.status(404).json({error: 'Product not found in cart.'});
//         }
  
//         userCart.items.splice(cartItemIndex, 1);


//          userCart.items.reduce(
//         (total, item) => total - (item.quantity || 0),
//         0)
//         await userCart.save();
  
       
//         res.redirect('/cart');
//     } catch (error) {
//         console.error('Error removing item from cart:', error);
//         res.status(500).json({ error: 'An error occurred while removing item from cart.' });
//     }
//   };

const deleteCart = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const productId = req.query.productId;
  
      const existingCart = await Cart.findOne({ user: userId });
      if (existingCart) {
        const updatedItems = existingCart.items.filter(
          (item) => item.product.toString() !== productId
        );
  
        existingCart.items = updatedItems;
        existingCart.total = updatedItems.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        );
  
        await existingCart.save();
  
        res.json({ success: true, toaster: true });
      } else {
        res.json({ success: false, error: "Cart not found" });
      }
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.json({ success: false, error: "Internal server error" });
    }
  };
  //=====================================================================================================================================//
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

//=====================================================================================================================================//
//update cartcount
  const updateCartCount = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const productId = req.query.productId;
      const newQuantity = parseInt(req.query.quantity);
  
      const existingCart = await Cart.findOne({ user: userId });
      if (existingCart) {
        const existingCartItem = existingCart.items.find(
          (item) => item.product.toString() === productId
        );
  
        if (existingCartItem) {
          existingCartItem.quantity = newQuantity;
          existingCart.total = existingCart.items.reduce(
            (total, item) => total + (item.quantity || 0),
            0
          );
  
          await existingCart.save();
        }
  
        res.json({ success: true });
      } else {
        res.json({ success: false, error: "Cart not found" });
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      res.json({ success: false, error: "Internal server error" });
    }
  };
//=====================================================================================================================================//  

module.exports = {
    addtocart,
    getcart,
    deleteCart,
    updateQuantity ,
    updateCartCount
 
}
//=====================================================================================================================================//
//=====================================================================================================================================//



