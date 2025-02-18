const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    amountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    offerPrice: {
        type: Number,
        required: true,
        min: 0
    },
    minimumPrice: {
        type: Number,
        required: true,
        min: 0
    },
    startOn: {
        type: Date,
        required: true
    },
    expireOn: {
        type: Date,
        required: true
    },
    isList: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// Middleware to ensure expiry date is after start date
couponSchema.pre('validate', function(next) {
    if (this.expireOn <= this.startOn) {
        next(new Error('Expiry date must be after start date'));
    } else {
        next();
    }
});


const Coupon = mongoose.model("Coupon",couponSchema)

module.exports = Coupon;