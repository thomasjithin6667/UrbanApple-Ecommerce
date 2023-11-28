//=====================================================================================================================================//
//USER CONTROLLER
//=====================================================================================================================================//
//module imports

const User = require('../models/userModel');
const UserOTPVerification = require('../models/userOTPModel')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel');
const Transaction = require('../models/transactionModel')
const Banner = require('../models/bannerModel')
//function to hash password
const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error.message);

    }
}

//=====================================================================================================================================//
//create transport object
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: 'mindspacesongs@gmail.com',
        pass: 'esdp lsnv xtfw fcwt'
    }

});

//=====================================================================================================================================//
//load register page 
const loadRegister = async (req, res) => {

    try {
        res.render('registration')

    } catch (error) {

        console.log(error.message);

    }



};
//=====================================================================================================================================//
//load insert user
const insertUser = async (req, res) => {
    try {
        const userExist = await User.findOne({ email: req.body.email });
        req.session.referralCode = req.body.referralCode || null;
        const referralCode = req.session.referralCode;

        if (userExist) {
            res.render('registration', { message: "User already exists" });
        } else {
            let referrer;

            if (referralCode) {
                referrer = await User.findOne({ referralCode });

                if (!referrer) {

                    res.render('registration', { message: 'Invalid referral code.' });
                }

                if (referrer.referredUsers.includes(req.body.email)) {

                    res.render('registration', { message: 'Referral code has already been used by this email.' });
                }
            }

            const spassword = await securePassword(req.body.password);
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mno,
                password: spassword,
                is_Admin: 0,
                
               
                

            });

            const userData = await user.save();
            req.session.id2 = userData._id;

            sentOTPVerificationEmail(req, res, req.body.email, userData._id);


            if (userData) {
                res.render('otp-page', { user: userData });
            } else {
                res.render('registration', { message: "Registration Failed" });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};
//=====================================================================================================================================//
//load blog page 
const loadBlog = async (req, res) => {

    try {



        if (req.session.user_id) {

            const userData = await User.findById({ _id: req.session.user_id })
            res.render('bloglist', { user: userData})




        } else {
            res.render('bloglist', { user: null })






        }






    } catch (error) {

        console.log(error.message);

    }



};
//=====================================================================================================================================//
//load contact page
const loadContact = async (req, res) => {

    try {

        
        if (req.session.user_id) {

            const userData = await User.findById({ _id: req.session.user_id })
            res.render('contact', { user: userData})




        } else {
            res.render('contact', { user: null })






        }





    } catch (error) {

        console.log(error.message);

    }



};

//=====================================================================================================================================//
//function to laod homepage
const loadHome = async (req, res) => {
    try {


        if (req.session.user_id) {
            const currentDate = new Date();
            const productsData = await Product.find({ list: true });
            const userData = await User.findById({ _id: req.session.user_id })
            const categoriesData = await Category.find({})


            const banner = await Banner.find({
                startDate: { $lt: currentDate },
                endDate: { $gt: currentDate },
                isListed: true,
            }).populate('product');

            res.render('home', { user: userData, categories: categoriesData, products: productsData, banner: banner })

        } else {
            const currentDate = new Date();
            const categoriesData = await Category.find({})
            const productsData = await Product.find({ list: true });

            const banner = await Banner.find({
                startDate: { $lt: currentDate },
                endDate: { $gt: currentDate },
                isListed: true,
            }).populate('product');
            res.render('home', { user: null, categories: categoriesData, products: productsData, banner: banner })


        }
    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
//function to load otp page
const loadOTPpage = async (req, res) => {
    const errorMessage = req.query.error;
    const user = req.user;
    req.session.user = user

    try {
        res.render('otp-page', { user, errorMessage });
    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
//function to sent otp verification mail
const sentOTPVerificationEmail = async (req, res, email, _id) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        req.session.otp = otp;

        console.log("the otp is  " + req.session.otp);
        console.log("for the email " + email);


        const mailOptions = {
            from: "mindspacesongs@gmail.com",
            to: email,
            subject: "Otp verification",
            html: `<p>The otp is  <b>${otp}</b> </p>`,
        };


        // Hash password
        const hashedOTP = await bcrypt.hash(otp, 10);

        const newOTPVerification = new UserOTPVerification({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 120000,
        });

        await newOTPVerification.save();

        await transporter.sendMail(mailOptions, async (err, status) => {
            if (err) {
                console.log('Err', err);
            } else {




            }
        });

    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
//function to verify otp
const OTPVerification = async (req, res) => {
    try {
        const userId = req.session.id2;
        const otp = req.body.fullOTP;

        if (!otp) {
            const errorMessage = "Empty OTP details are not allowed";
            return res.redirect(`/otp-page?error=${errorMessage}`);
        } else {
            const userOTPVerificationRecords = await UserOTPVerification.find({
                userId
            });

            if (userOTPVerificationRecords.length <= 0) {
                await UserOTPVerification.deleteMany({ userId });
                const errorMessage = "Invalid code. Please request again.";
                return res.redirect(`/otp-page?error=${errorMessage}`);
            } else {
                const { expiresAt } = userOTPVerificationRecords[0];
                const hashedOTP = userOTPVerificationRecords[0].otp;

                if (expiresAt < Date.now()) {
                    await UserOTPVerification.deleteMany({ userId });
                    const errorMessage = "Code has expired. Please request again.";
                    return res.redirect(`/otp-page?error=${errorMessage}`);
                } else {
                    const validOTP = await bcrypt.compare(otp, hashedOTP);

                    if (!validOTP) {
                        const errorMessage = "Invalid code passed. Check your inbox";
                        return res.redirect(`/otp-page?error=${errorMessage}`);
                    } else {
                        if (req.session.referralCode) {
                            await User.updateOne({ _id: userId }, { is_verified: 1, walletBalance: 50 });
                            const referrer = await User.findOne({ referralCode: req.session.referralCode });
                            const user = await User.findOne({ _id: userId });
                            referrer.referredUsers.push(user.email);
                            referrer.walletBalance += 100;
                            await referrer.save();

                            const referredUserTransaction = new Transaction({
                                user: referrer._id,
                                amount: 100,
                                type: 'credit',
                                date: Date.now(),
                                paymentMethod: "Wallet Payment",
                                description: 'Referral Bonus',
                            });
                            const referrerTransaction = new Transaction({
                                user: userId,
                                amount: 50,
                                type: 'credit',
                                date: Date.now(),
                                paymentMethod: "Wallet Payment",
                                description: 'Referral Bonus',
                            });
                            await referredUserTransaction.save();
                            await referrerTransaction.save();



                        } else {
                            await User.updateOne({ _id: userId }, { is_verified: 1 });
                        }

                        delete req.session.referralCode;
                        delete req.session.otp;

                        await UserOTPVerification.deleteMany({ userId });

                        res.render("otp-successpage");
                    }
                }
            }
        }
    } catch (error) {
        const errorMessage = "An error occurred during OTP verification";
        return res.redirect(`/otp-page?error=${errorMessage}`);
    }
};

//=====================================================================================================================================//
//function to load user login page
const loginLoad = async (req, res) => {
    try {

        res.render('login');




    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
//function to verify login details
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    return res.render('login', { message: "Please verify your email." });
                } else if (userData.isBlocked) {
                    return res.render('login', { message: "You are not authorized." });
                } else {
                    req.session.user = userData;
                    req.session.user_id = userData._id;
                    const originalUrl = req.session.originalUrl || '/home';

                    res.redirect(originalUrl);
                    delete req.session.originalUrl;

                }
            } else {
                return res.render('login', { message: "Email and password are incorrect." });
            }
        } else {
            return res.render('login', { message: "Email and password are incorrect." });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('An error occurred');
    }
};

//=====================================================================================================================================//
//function to load user profile page
const loadUserProfile = async (req, res) => {

    const userData = await User.findById({ _id: req.session.user_id })
    try {
        res.render('userProfile', { user: userData })
    } catch (error) {
        console.log(error.message)

    }
};

//=====================================================================================================================================//
//function to load user profile Dashboard
const loadUserDashboard = async (req, res) => {

    const userData = await User.findById({ _id: req.session.user_id })
    try {
        res.render('userDashboard', { user: userData })
    } catch (error) {
        console.log(error.message)

    }
};

//=====================================================================================================================================//

//function to logout user
const userLogout = async (req, res) => {
    try {
        req.session.destroy();

        res.redirect('/')

    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
// function to load forgot password page
const forgotPassword = async (req, res) => {

    try {


        res.render('forgetpassword')

    } catch (error) {

        console.log(error.message);

    }



}

//=====================================================================================================================================//
const forgotOTPVerification = async (req, res) => {
    try {
        const userId = req.session.id2;
        const otp = req.body.fullOTP;

        if (!otp) {
            const errorMessage = "Empty OTP details are not allowed";
            return res.redirect(`/otp-page?error=${errorMessage}`);
        } else {
            const userOTPVerificationRecords = await UserOTPVerification.find({
                userId
            });

            if (userOTPVerificationRecords.length <= 0) {
                const errorMessage = "Account record doesn't exist or has been verified already. Please sign up or...";
                return res.redirect(`/otp-page?error=${errorMessage}`);
            } else {
                const { expiresAt } = userOTPVerificationRecords[0];
                const hashedOTP = userOTPVerificationRecords[0].otp;

                if (expiresAt < Date.now()) {
                    await UserOTPVerification.deleteMany({ userId });
                    const errorMessage = "Code has expired. Please request again.";
                    return res.redirect(`/otp-page?error=${errorMessage}`);
                } else {
                    const validOTP = await bcrypt.compare(otp, hashedOTP);

                    if (!validOTP) {
                        const errorMessage = "Invalid code passed. Check your inbox";
                        return res.redirect(`/otp-page?error=${errorMessage}`);
                    } else {
                        await User.updateOne({ _id: userId }, { is_verified: 1 });
                        await UserOTPVerification.deleteMany({ userId });
                        res.render("otp-sucssespage")
                    }
                }
            }
        }
    } catch (error) {
        const errorMessage = "An error occurred during OTP verification";
        return res.redirect(`/otp-page?error=${errorMessage}`);
    }
};

//=====================================================================================================================================//
//function for senting otp verification mail
const sentPasswordOTPVerificationEmail = async (req, res, email, _id) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        req.session.otp2 = otp;
        console.log("forgot password");

        console.log(req.session.otp2);


        const mailOptions = {
            from: "mindspacesongs@gmail.com",
            to: email,
            subject: "Verify your email",
            html: `<p>Enter <b>${otp}</b> in the app to reset your password</p>`,
        };


        // Hash password
        const hashedOTP = await bcrypt.hash(otp, 10);

        const newOTPVerification = new UserOTPVerification({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 120000,
        });

        await newOTPVerification.save();

        await transporter.sendMail(mailOptions, async (err, status) => {
            if (err) {
                console.log('Err', err);
            } else {




            }
        });

    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
//to load the otp page
const userforgotPasswordOTP = async (req, res) => {
    try {
        const userExist = await User.findOne({ email: req.body.email });

        if (userExist) {
            req.session.id3 = userExist._id
            console.log(req.session.id3);

            (req, res, req.body.email, userExist._id);
            res.render('forgetpassword-otp', { message: "Otp sent to your mail" });
        } else {



            res.render('forgetpassword', { message: "Account details doesnt match" });

        }
    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
//to load the otp page
const forgotPasswordOTP = async (req, res) => {
    try {
        const userExist = await User.findOne({ email: req.body.email });

        if (userExist) {
            req.session.id3 = userExist._id
            console.log("forgot" + req.session.id3);


            sentPasswordOTPVerificationEmail(req, res, req.body.email, userExist._id);
            res.render('forgetpassword-otp', { message: "Otp sent to your mail" });
        } else {



            res.render('forgetpassword', { message: "Account details doesnt match" });

        }
    } catch (error) {
        console.log(error.message);
    }
};

//=====================================================================================================================================//
//forgot password otp verification 
const passwordOTPVerification = async (req, res) => {
    try {
        const userId = req.session.id3;
        const otp = req.body.fullOTP;

        if (!otp) {
            const errorMessage = "Empty OTP details are not allowed";
            return res.redirect(`/otp-page?error=${errorMessage}`);
        } else {
            const userOTPVerificationRecords = await UserOTPVerification.find({
                userId
            });

            if (userOTPVerificationRecords.length <= 0) {
                const errorMessage = "Ivalid otp, Please request again";
                return res.redirect(`/otp-page?error=${errorMessage}`);
            } else {
                const { expiresAt } = userOTPVerificationRecords[0];
                const hashedOTP = userOTPVerificationRecords[0].otp;

                if (expiresAt < Date.now()) {
                    await UserOTPVerification.deleteMany({ userId });
                    const errorMessage = "Code has expired. Please request again.";
                    return res.redirect(`/otp-page?error=${errorMessage}`);
                } else {
                    const validOTP = await bcrypt.compare(otp, hashedOTP);

                    if (!validOTP) {
                        const errorMessage = "Invalid code passed. Check your inbox";
                        return res.redirect(`/otp-page?error=${errorMessage}`);
                    } else {


                        await UserOTPVerification.deleteMany({ userId });
                        res.render("forgetpassword-change")
                    }
                }
            }
        }
    } catch (error) {
        const errorMessage = "An error occurred during OTP verification";
        return res.redirect(`/otp-page?error=${errorMessage}`);
    }
};

//=====================================================================================================================================//
//function to reset password for logfedin user
const resetPassword = async (req, res) => {
    try {

        const password = req.body.password;
        const user_id = req.session.id3
        const secure_password = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password } });
        res.render("forgetpassword-otpsuccess")


    } catch (error) {

    }
};

//=====================================================================================================================================//
//load user reset password page
const loadUserPasswordReset = async (req, res) => {

    try {


        res.render('userpassword-change');



    } catch (error) {

        console.log(error.message);

    }



};

//=====================================================================================================================================//
//change password
const userResetPassword = async (req, res) => {
    try {

        const password = req.body.password;
        const user_id = req.session.user_id

        const secure_password = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password } });
        res.render("userProfile", { user: updatedData })


    } catch (error) {

    }
};

//=====================================================================================================================================//
//load user edit page
const loadEditUser = async (req, res) => {

    try {

        const userData = await User.findById({ _id: req.session.user_id })

        res.render('edit-userProfile', { user: userData });



    } catch (error) {

        console.log(error.message);

    }



};

//=====================================================================================================================================//
//load wallet page
const loadWallet = async (req, res) => {

    try {

        const userData = await User.findById({ _id: req.session.user_id })
        const transaction = await Transaction.find({ user: req.session.user_id, paymentMethod: "Wallet Payment" }).sort({ date: -1 });

        res.render('userWallet', { user: userData, transaction: transaction });



    } catch (error) {

        console.log(error.message);

    }



};

//=====================================================================================================================================//
//function to update profile
const updateProfile = async (req, res) => {

    try {

        if (req.file) {
            const userData = await User.findByIdAndUpdate({ _id: req.session.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno, image: req.file.filename } })


        } else {
            const userData = await User.findByIdAndUpdate({ _id: req.session.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno } })

        }

        const userData = await User.findById({ _id: req.session.user_id })
        res.render('userProfile', { user: userData })

    } catch (error) {
        console.log(error.message);

    }

};

//=====================================================================================================================================//
//delete account
const deleteUser = async (req, res) => {

    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id })
        req.session.destroy();
        res.redirect('/')

    } catch (error) {
        console.log(error.message);

    }


};

//=====================================================================================================================================//
//function to resend otp
const resendOTP = async (req, res) => {
    try {
        const userId = req.session.id2;
        const user = await User.findById(userId);
        if (user) {

            await UserOTPVerification.deleteMany({ userId });

            sentOTPVerificationEmail(req, user.name, user.email, userId);


            res.render('otp-page', { message: "OTP has been resent.", User: null });
        } else {
            res.render('otp-page', { message: "User not found", User: null });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error", User: null });
    }
};

//=====================================================================================================================================//

module.exports = {
    loadRegister,
    loadHome,
    insertUser,
    OTPVerification,
    loadOTPpage,
    loginLoad,
    verifyLogin,
    loadUserProfile,
    userLogout,
    forgotPassword,
    sentPasswordOTPVerificationEmail,
    forgotPasswordOTP,
    passwordOTPVerification,
    resetPassword,
    loadEditUser,
    updateProfile,
    userResetPassword,
    loadUserPasswordReset,
    deleteUser,
    userforgotPasswordOTP,
    loadBlog,
    loadContact,
    resendOTP,
    loadWallet,
    loadUserDashboard

}
//=====================================================================================================================================//
//=====================================================================================================================================//