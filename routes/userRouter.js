const express = require("express")
const router = express.Router();
const passport = require('passport');
const userController = require("../controller/user/userController");
const productController = require("../controller/user/productController")
const profileController = require("../controller/user/profileController")
const cartController = require("../controller/user/cartController")
const {checkOutPage,placeOrder} = require("../controller/user/checkoutController")
const orderController = require("../controller/user/orderController")
const {userAuth, isAuthenticated,noCache,incrementProductViews} = require("../middlewares/auth")


router.use(noCache)

router.get("/pageNotFound", userController.pageNotFound)
router.get("/",isAuthenticated,userController.loadHomepage);
router.get("/shop",productController.getProductsByCategory)


router.get("/signup",userController.loadSignup);
router.post("/signup",userController.SignUp);
router.post("/verify-otp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));
router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect:"/signup"}),(req,res)=>{
    req.session.user = req.user; 
    res.redirect('/')
});
router.get("/login",userController.loadLogin);
router.post("/login",userController.login);

//product management
// router.get("/productDetails",userAuth,productController.productDetails);
router.all("/productDetails", 
    userAuth, 
    incrementProductViews, 
    productController.productDetails
);

router.post('/productDetails/review', userAuth, productController.submitReview);


// profile management

router.get("/forgot-password",profileController.getForgotPassword)
router.post("/forgot-email-valid",profileController.forgotEmailValid)
router.post("/verify-passForgetOtp",profileController.verifyForgetPassOtp)
router.get("/reset-Password",profileController.getResetPassword)
router.post("/resend-forgot-otp",profileController.resendOtp);
router.post("/reset-password",profileController.NewPassword);
router.get("/userProfile",userAuth,profileController.userProfile)
router.post('/edit-profile', userAuth, profileController.editProfile);
router.get("/change-password",userAuth,profileController.changePassword)
router.post("/change-password",userAuth,profileController.validateAndChangePassword)
router.get('/orders',userAuth,orderController.getUserOrders);



//address management
router.get("/addAddress",userAuth,profileController.addressPage)
router.post("/addAddress",userAuth,profileController.postaddAddress)
router.get("/editAddress",userAuth,profileController.editAddress);
router.post("/editAddress",userAuth,profileController.postEditAddress)
router.get("/deleteAddress", userAuth, profileController.deleteAddress);

//cart management
router.get("/cart", userAuth, cartController.getCart);
router.post("/cart/add", userAuth, cartController.addToCart);
router.post("/cart/update", userAuth, cartController.updateCart);
router.post("/cart/remove", userAuth, cartController.removeFromCart);
// router.post("/cart/clear", userAuth, cartController.clearCart);



//checkout 
router.get("/checkout",userAuth,checkOutPage)
router.post("/place-order",userAuth,placeOrder)
router.get('/order/success/:orderId', userAuth,orderController.orderSuccessPage);
router.post('/cancel-order/:orderId',userAuth,orderController.cancelOrder);



router.get("/logout",userController.logout);

module.exports = router;