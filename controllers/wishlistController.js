//=====================================================================================================================================//
//WISHLIST CONTROLLER
//=====================================================================================================================================//
//import statements

const Cart = require('../models/cartModel'); 
const Wishlist=require('../models/wishlistModel')

//=====================================================================================================================================//
//funtion to add item to wishlist
const addToWishlist = async (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.productId;

    try {
        const userWishlist = await Wishlist.findOne({ user: userId });

        if (!userWishlist) {
            userWishlist = new Wishlist({
                user: userId,
                items: [{ product: productId }],
            });
        } else {
            const existingWishlistItem = userWishlist.items.find((item) => item.product.toString() === productId);

            if (existingWishlistItem) {
                req.flash('error', 'Product is already in your wishlist.');
            } else {
                userWishlist.items.push({ product: productId });
            }
        }

        await userWishlist.save();

        res.redirect('/productlist');
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
    }
};

//=====================================================================================================================================//
//functon to load wishliat page
const getWishlist = async (req, res) => {
    const userId = req.session.user._id;

    try {
        const userWishlist = await Wishlist.findOne({ user: userId }).populate('items.product');

        const wishlist = userWishlist ? userWishlist.items : [];
      
        res.render('wishlist', { user: req.session.user, wishlist });
    } catch (err) {
        console.error('Error fetching user wishlist:', err);

    }
};

//=====================================================================================================================================//
//function to add item from wishlsit to cart
const addToCartFromWishlist = async (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.productId;

    try {
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');
        const userWishlist = await Wishlist.findOne({ user: userId }).populate('items.product');

        if (!userCart || !userWishlist) {     
            res.redirect('/wishlist');
            return;
        }

        const cartItem = userCart.items.find((item) => item.product.toString() === productId);
        const wishlistItemIndex = userWishlist.items.findIndex((item) => item.product.toString() === productId);

        if (cartItem) {
            res.redirect('/wishlist');
            return;
        }

        if (wishlistItemIndex !== -1) {
            const removedItem = userWishlist.items.splice(wishlistItemIndex, 1);
            userCart.items.push({ product: removedItem[0].product });

      
            await userCart.save();
            await userWishlist.save();
        }

        res.redirect('/wishlist');
    } catch (err) {
        console.error('Error adding item to cart from wishlist:', err);
     
    }
};

//=====================================================================================================================================//
//Function to remove item from wishlist
const removeFromWishlist= async (req, res) => {
    const userId = req.session.user_id;
    console.log(userId);
    const productId = req.params.productId;
    console.log(productId+"productid");
  
    try {
        const userWishlist = await Wishlist.findOne({user: userId});
        console.log(userWishlist);
  
        if (!userWishlist) {
            return res.status(404).json({error: 'wishlist  not found.'});
        }
  
        const wishlistItemIndex = userWishlist.items.findIndex((item) => item.product.toString() === productId);
        console.log(wishlistItemIndex);
  
        if (wishlistItemIndex  === -1) {
            return res.status(404).json({error: 'Product not found in cart.'});
        }
  
        userWishlist.items.splice(wishlistItemIndex , 1);
        await userWishlist.save();
  
       
        res.redirect('/wishlist');
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        res.status(500).json({ error: 'An error occurred while removing item from wishlist.' });
    }
  };

//=====================================================================================================================================//

module.exports = {
    addToWishlist,
    getWishlist,
    addToCartFromWishlist,
    removeFromWishlist
 
}

//=====================================================================================================================================//
//=====================================================================================================================================//