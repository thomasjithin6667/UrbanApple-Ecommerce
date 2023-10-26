
//import statements
const Cart = require('../models/cartModel'); 
const User=require('../models/userModel');
const Product = require('../models/productModel')

const addtocart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const productId = req.params.productId;
        const { qty } = req.body;

        const existingCart = await Cart.findOne({ user: userId });
        let newCart = {}

        if (existingCart) {
            const existingCartItem = existingCart.items.find(item => item.product.toString() === productId);

            if (existingCartItem) {
                existingCartItem.quantity += parseInt(qty, 10);
            } else {
                existingCart.items.push({ product: productId, quantity: parseInt(qty, 10) });
            }

            existingCart.total = existingCart.items.reduce((total, item) => total + (item.quantity || 0), 0);

            await existingCart.save();
        } else {
            // If the user doesn't have an existing cart, create a new one
            newCart = new Cart({
                user: userId,
                items: [{ product: productId, quantity: parseInt(qty, 10) }],
                total: parseInt(qty, 10),
            });

            // Save the new cart
            await newCart.save();
        }

        req.session.cartLength = (existingCart || newCart).items.length;

        res.redirect('/viewproduct/'+productId)
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = {
    addtocart 
 
}



