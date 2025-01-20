const express = require("express");
const router = express.Router();
const adminControllers = require("../controller/admin/adminControllers");
const customerController = require("../controller/admin/customerController")
const categoryController = require("../controller/admin/categoryController")
const productControllers = require("../controller/admin/productControllers")
const brandController = require("../controller/admin/brandController")
const orderController = require("../controller/admin/orderController")
const {adminAuth,noCache} = require("../middlewares/auth");
const {uploads,addBrandWithImage,uploadCategoryImage} = require("../helpers/multer");

router.use(noCache)

router.get("/pageerror",adminControllers.pageError);
router.get("/login",adminControllers.loadLogin);
router.post("/login",adminControllers.login);
router.get("/",adminAuth,adminControllers.loadDashboard);
router.get("/logout",adminAuth,adminControllers.logout)
router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerunBlocked);
router.get("/category",adminAuth,categoryController.categoryInfo)



router.post("/addCategory",adminAuth,uploadCategoryImage,categoryController.addCategory);
// router.post('/addCategory', ,categoryController.addCategory);
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getunListCategory);
router.get("/editCategory",adminAuth,categoryController.getEditCategory);
router.post("/editCategory/:id",adminAuth,categoryController.editCategory)

// product management

router.get("/addProducts",adminAuth,productControllers.getProductAddPage)
router.post("/addProducts",adminAuth,uploads.array("images",4),productControllers.addProducts)
router.get("/products",adminAuth,productControllers.getAllProducts);
router.get("/editProduct",adminAuth,productControllers.getEditProduct)
router.post("/editProduct/:id",adminAuth,uploads.array("images",4),productControllers.editProducts)
router.post("/deleteImage",adminAuth,productControllers.deleteSingleImage)


//brand Management

router.get('/brands', brandController.getBrands)
router.post('/addBrand',addBrandWithImage,brandController.addBrand);
router.get('/brands/toggle-status/:brandId',brandController.toggleBrandStatus);
router.get('/brands/delete/:brandId',brandController.deleteBrand);


//order managment

// router.get("/orderList",adminAuth,orderController.getAllOrders)
// router.get("/orderList/:id",adminAuth,orderController.getOrderDetails)
// router.put("/orderList/:id/updateStatus", adminAuth, orderController.updateOrderStatus);

router.get("/orderList", adminAuth, orderController.getAllOrders);
router.put("/orderList/updateStatus/:id", adminAuth, orderController.updateOrderStatus);


router.get("/blockProduct",adminAuth,productControllers.blockProduct);
router.get("/unblockProduct",adminAuth,productControllers.unblockProduct);


module.exports = router;