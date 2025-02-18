
const User = require("../../model/userSchema");
const Cart = require("../../model/cartSchema")
const Order = require("../../model/orderSchema")
const Coupon = require("../../model/couponSchema")


// Get available coupons for cart total
const getAvailableCoupons = async (req, res) => {
    try {
        const { cartTotal } = req.body;
        const currentDate = new Date();
        
        const coupons = await Coupon.find({
            isList: true,
            startOn: { $lte: currentDate },
            expireOn: { $gt: currentDate },
            minimumPrice: { $lte: cartTotal }
        });

        res.json({
            success: true,
            coupons
        });
    } catch (error) {
        console.error('Error fetching available coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available coupons'
        });
    }
};

// Validate and apply coupon

const validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        const currentDate = new Date();

        const coupon = await Coupon.findOne({
            name: code.toUpperCase(),
            isList: true,
            startOn: { $lte: currentDate },
            expireOn: { $gt: currentDate }
        });

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired coupon'
            });
        }

        // Check minimum purchase requirement
        if (cartTotal < coupon.minimumPrice) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of $${coupon.minimumPrice} required for this coupon`
            });
        }

        // Calculate discount
        let discountAmount;
        if (coupon.amountType === 'percentage') {
            discountAmount = (cartTotal * coupon.offerPrice) / 100;
        } else {
            discountAmount = coupon.offerPrice;
        }

        res.json({
            success: true,
            coupon: {
                id: coupon._id,
                name: coupon.name,
                discountAmount,
                amountType: coupon.amountType,
                offerPrice: coupon.offerPrice
            }
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating coupon'
        });
    }
};


module.exports= {
    getAvailableCoupons,
    validateCoupon
}