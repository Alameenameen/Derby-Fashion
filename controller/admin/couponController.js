const Coupon = require('../../model/couponSchema');

// / Get all coupons
const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdOn: -1 });
        res.render('coupon', {
            coupons,
            currentPage: 'coupons'
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupons'
        });
    }
};

// Add new coupon
const addCoupon = async (req, res) => {
    try {
        const {
            name,
            amountType,
            offerPrice,
            minimumPrice,
            startOn,
            expireOn
        } = req.body;

        // Validate required fields
        if (!name || !amountType || !offerPrice || !minimumPrice || !startOn || !expireOn) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate amount type
        if (!['percentage', 'fixed'].includes(amountType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount type'
            });
        }

        // Validate dates
        const startDate = new Date(startOn);
        const expiryDate = new Date(expireOn);
        const currentDate = new Date();

        if (startDate <= currentDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be today or in the future'
            });
        }

        if (expiryDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'Expiry date must be after start date'
            });
        }

        // Validate offer price
        const numericOfferPrice = parseFloat(offerPrice);
        if (amountType === 'percentage' && (numericOfferPrice < 0 || numericOfferPrice > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage must be between 0 and 100'
            });
        }

        if (numericOfferPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Offer amount must be greater than 0'
            });
        }

        // Validate minimum purchase
        const numericMinPrice = parseFloat(minimumPrice);
        if (numericMinPrice < 0) {
            return res.status(400).json({
                success: false,
                message: 'Minimum purchase amount cannot be negative'
            });
        }

        // Check for existing coupon
        const existingCoupon = await Coupon.findOne({ 
            name: name.toUpperCase() 
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon with this name already exists'
            });
        }

        // Create new coupon
        const newCoupon = new Coupon({
            name: name.toUpperCase(),
            amountType,
            offerPrice: numericOfferPrice,
            minimumPrice: numericMinPrice,
            startOn: startDate,
            expireOn: expiryDate,
            isList: true
        });

        await newCoupon.save();

        res.status(201).json({
            success: true,
            message: 'Coupon added successfully'
        });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding coupon'
        });
    }
};

// Update coupon status
const updateCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.params;
        
        // Validate coupon ID
        if (!couponId) {
            return res.status(400).json({
                success: false,
                message: 'Coupon ID is required'
            });
        }

        const coupon = await Coupon.findById(couponId);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        coupon.isList = !coupon.isList;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Coupon ${coupon.isList ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error updating coupon status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating coupon status'
        });
    }
};

// Delete coupon
const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        // Validate coupon ID
        if (!couponId) {
            return res.status(400).json({
                success: false,
                message: 'Coupon ID is required'
            });
        }

        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting coupon'
        });
    }
};

// Get coupon by ID
const getCouponById = async (req, res) => {
    try {
        const { couponId } = req.params;

        if (!couponId) {
            return res.status(400).json({
                success: false,
                message: 'Coupon ID is required'
            });
        }

        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.status(200).json({
            success: true,
            coupon
        });
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupon'
        });
    }
};


// Update coupon
const updateCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const {
            name,
            amountType,
            offerPrice,
            minimumPrice,
            startOn,
            expireOn
        } = req.body;

        // Validate required fields
        if (!name || !amountType || !offerPrice || !minimumPrice || !startOn || !expireOn) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate amount type
        if (!['percentage', 'fixed'].includes(amountType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount type'
            });
        }

        // Validate dates
        const startDate = new Date(startOn);
        const expiryDate = new Date(expireOn);

        if (expiryDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'Expiry date must be after start date'
            });
        }

        // Validate offer price
        const numericOfferPrice = parseFloat(offerPrice);
        if (amountType === 'percentage' && (numericOfferPrice < 0 || numericOfferPrice > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage must be between 0 and 100'
            });
        }

        if (numericOfferPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Offer amount must be greater than 0'
            });
        }

        // Check for existing coupon with same name 
        const existingCoupon = await Coupon.findOne({
            _id: { $ne: couponId },
            name: name.toUpperCase()
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon with this name already exists'
            });
        }

        // Update coupon
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            {
                name: name.toUpperCase(),
                amountType,
                offerPrice: numericOfferPrice,
                minimumPrice: parseFloat(minimumPrice),
                startOn: startDate,
                expireOn: expiryDate
            },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Coupon updated successfully'
        });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating coupon'
        });
    }
};

module.exports = {
    getAllCoupons,
    addCoupon,
    updateCouponStatus,
    deleteCoupon,
    getCouponById,
    updateCoupon
};