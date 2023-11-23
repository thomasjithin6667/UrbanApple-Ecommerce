//=====================================================================================================================================//
//CHECKOUT CONTROLLER
//=====================================================================================================================================//
//module imports
const User = require('../models/userModel');
const Product = require('../models/productModel');
//=====================================================================================================================================//
//Function to post a review
const postReview = async (req, res)=>{
    const reviewText = req.body.description;
    const productId  =req.body.productId
    const rating = req.body.rating;
    const userId = req.session.user._id;
    try{
      const existingReview = await Review.findOne({
        productId: productId,
        userId: userId,
      });
  
      if (existingReview) {
        existingReview.starRating = rating;
        existingReview.description = reviewText;
        existingReview.date = Date.now();
  
        await existingReview.save();
      }else{
        const review = new Review({
          productId : productId,
          userId : userId,
          starRating : rating,
          description : reviewText,
          date : Date.now()
        })
        await review.save()
      }
      res.redirect('/viewproduct/' + productId)
    }catch(err){
      console.log("Error occoured while posting review : ", err);
    }
  }

//=====================================================================================================================================//
//function to get all the reviews done by a user  
const viewrating = async (req, res) => {
    try {
      const user = req.session.user;
      const productId = req.params.productId;
      const reviews = await Review.find({userId : user._id}).populate('productId'); 
      const categoryPo = await Category.find();
      reviews.forEach((review) => {
        review.formattedDate = new Date(review.date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        });
      });
  
      res.render('./user/viewRatingReview', { reviews, user, categoryPo});
    } catch (error) {
      console.log("error fetching details ", error);
    }
  };

//=====================================================================================================================================//
//delete a particular review done by the user
const deleteReview = async (req, res)=>{
    try{
      const reviewId = req.params.reviewId;
      const rev = await Review.findByIdAndDelete(reviewId)
      res.redirect('/viewratings')
    }catch(err){
      console.log("Error occoured while deleting review",err);
    }
  }


//=====================================================================================================================================//
//function to get all the reviews done for a product by the user in the admin side


//=====================================================================================================================================//


module.exports = {
    postReview,
    viewrating,
    deleteReview

    }


//=====================================================================================================================================//
//=====================================================================================================================================//
    


  