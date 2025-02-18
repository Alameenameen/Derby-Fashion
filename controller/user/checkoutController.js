const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");
const User = require("../../model/userSchema");
const Coupon = require("../../model/couponSchema")
const Wallet = require("../../model/walletSchema")
const Cart = require("../../model/cartSchema")
const Address = require("../../model/addressSchema")
const Order = require("../../model/orderSchema")
// const razorpayInstance = require('../../config/razorpay');
const crypto = require("crypto");
const Razorpay = require("razorpay");
require('dotenv').config();
const mongoose = require("mongoose");






const calculateTotals = (cartItems) => {
    try{
    let subtotal = 0;
    let totalItems = 0;
    
    // Calculate subtotal and total items
    cartItems.forEach(item => {
        if (!item.productId) {
            throw new Error("Product not found in cart item");
        }
        
        // Use salePrice if available, otherwise use regular price
        const itemPrice = item.productId.salePrice || item.productId.price;
        if (typeof itemPrice !== "number") {
            console.log("Invalid price for product:", item.productId);
            throw new Error("Product price is invalid");
        }


        subtotal += itemPrice * item.quantity;
        totalItems += item.quantity;
    });

    // Calculate other amounts
    const tax = parseInt(subtotal * 0.10);  // 10% tax
    const shippingFee = totalItems * 50; // 50 per item
    const discount = subtotal * 0.10; // 10% discount
    
    // Calculate final total
    const totalPrice = subtotal + tax + shippingFee;
    const finalAmount = totalPrice - discount;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: shippingFee,
        discount: parseFloat(discount.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
        totalItems
    };
} catch (error) {
    console.error('Error calculating totals:', error);
    throw error;
}
};


const checkOutPage = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }

        const userId = req.session.user._id;
        
        // Fetch cart with populated product details
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                select: 'productName productImage price salePrice'
            });

        if (!cart) {
            return res.redirect('/cart');
        }


        // for (const item of cart.items) {
        //     const product = await Product.findById(item.productId._id);

        //     if (!product) continue;

        //     // Deduct total stock
        //     product.quantity -= item.quantity;

        //     // Deduct size-specific quantities
        //     const sizeDetail = product.sizes.find(s => s.size === item.size); // Match size directly
        //     if (sizeDetail) {
        //         sizeDetail.quantity -= item.quantity; // Deduct quantity for the matched size
        //     }

        //     // Update product status if out of stock
        //     if (product.quantity <= 0) {
        //         product.status = 'out of stock';
        //     }

        //     await product.save();
        // }
        // // Fetch user addresses
        const addressDoc = await Address.findOne({ userId });
        const addresses = addressDoc ? addressDoc.address : [];
        // Calculate totals using cart items
        const totals = calculateTotals(cart.items);

        res.render('checkout', { 
            cart,
            addresses,
            totals,
            user: req.session.user 
        });

    } catch (error) {
        console.error("Error loading checkout page:", error);
        res.status(500).send("Error loading checkout page");
    }
};

// const placeOrder = async (req, res) => {
//     try {
//         if (!req.session.user || !req.session.user._id) {
//             return res.status(401).json({ error: "Please login to continue" });
//         }

//         const userId = req.session.user._id;
//         const { addressIndex, paymentMethod,couponId } = req.body;

//         // Fetch address document
//         const addressDoc = await Address.findOne({ userId });
//         if (!addressDoc || !addressDoc.address[addressIndex]) {
//             return res.status(400).json({ error: 'Invalid address selected' });
//         }

//         // Get the selected address from the array
//         const selectedAddress = addressDoc.address[addressIndex];

//         // Fetch cart with populated product details
//         const cart = await Cart.findOne({ userId })
//             .populate('items.productId', 'price salePrice');

//         if (!cart || !cart.items.length) {
//             return res.status(400).json({ error: 'Cart is empty' });
//         }

//         for (const item of cart.items) {
//             const product = await Product.findById(item.productId._id);

//             if (!product) continue;

//             // Deduct total stock
//             product.quantity -= item.quantity;

//             // Deduct size-specific quantities
//             const sizeDetail = product.sizes.find(s => s.size === item.size);
//             if (sizeDetail) {
//                 sizeDetail.quantity -= item.quantity;
//             }

//             // Update product status if out of stock
//             if (product.quantity <= 0) {
//                 product.status = 'out of stock';
//             }

//             await product.save();
//         }

//         // Calculate totals
//         const totals = calculateTotals(cart.items);
//         let finalAmount = totals.totalPrice;
//         let discount = 0;
//         let appliedCoupon = null;

//         // Apply coupon if provided
//         if (couponId) {
//             const coupon = await Coupon.findOne({
//                 _id: couponId,
//                 isList: true,
//                 startOn: { $lte: new Date() },
//                 expireOn: { $gt: new Date() },
//                 minimumPrice: { $lte: totals.totalPrice }
//             });

//             if (coupon) {
//                 if (coupon.amountType === 'percentage') {
//                     discount = (totals.totalPrice * coupon.offerPrice) / 100;
//                 } else {
//                     discount = coupon.offerPrice;
//                 }
//                 finalAmount = totals.totalPrice - discount;
//                 appliedCoupon = coupon;
//             }
//         }


//         if (paymentMethod === "Online") {
//             // Create a Razorpay Order
//             const razorpayOrder = await razorpayInstance.orders.create({
//                 amount: finalAmount * 100, // Amount in paisa
//                 currency: "INR",
//                 receipt: `order_rcptid_${Date.now()}`,
//                 payment_capture: 1
//             });

//             return res.json({
//                 success: true,
//                 orderId: razorpayOrder.id,
//                 amount: finalAmount,
//                 currency: "INR",
//                 key: process.env.RAZORPAY_KEY_ID
//             });
//         } else {

//         // Create the new order
//         const newOrder = new Order({
//             orderedItems: cart.items.map((item) => ({
//                 product: item.productId._id,
//                 quantity: item.quantity,
//                 price: item.productId.salePrice || item.productId.price,
//                 productDetails: {
//                     productName: item.productId.productName,
//                     productImage: item.productId.productImage
//                 }
//             })),
//             size: cart.items[0].size,
//             totalPrice: totals.totalPrice,
//             discount: discount,
//             finalAmount: finalAmount,
//             address: {
//                 name: selectedAddress.name,
//                 street: selectedAddress.landMark, 
//                 city: selectedAddress.city,
//                 state: selectedAddress.state,
//                 zipCode: selectedAddress.pincode, 
//                 phone: selectedAddress.phone
//             },
//             user:userId,
//             status: paymentMethod === "COD" ? "pending" : "processing",
//             invoiceDate: new Date(),
//             createdOn: new Date(),
//             couponApplied: !!appliedCoupon,
//             couponDetails: appliedCoupon ? {
//                 couponId: appliedCoupon._id,
//                 couponName: appliedCoupon.name,
//                 discountAmount: discount
//             } : null
//         });       
//         console.log('New order data:', {
//             size: newOrder.size,
//             items: newOrder.orderedItems,
//             coupon: newOrder.couponDetails
//         });
        
//         await newOrder.save();
//         console.log("details",newOrder)
//         // Clear cart after order placement
//         await Cart.findOneAndDelete({ userId });

//         res.json({
//             success: true,
//             message: 'Order placed successfully!',
//             orderId: newOrder._id
//         });
//     }
//     } catch (error) {
//         console.error('Error placing order:', error);
//         res.status(500).json({ error: 'Failed to place order' });
//     }
// }



// const razorpayInstance = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// const placeOrder = async (req, res) => {
//     try {
//         if (!req.session.user || !req.session.user._id) {
//             return res.status(401).json({ error: "Please login to continue" });
//         }

//         const userId = req.session.user._id;
//         const { addressIndex, paymentMethod, couponId } = req.body;

//         const addressDoc = await Address.findOne({ userId });
//         if (!addressDoc || !addressDoc.address[addressIndex]) {
//             return res.status(400).json({ error: 'Invalid address selected' });
//         }

//         const selectedAddress = addressDoc.address[addressIndex];
//         const cart = await Cart.findOne({ userId }).populate('items.productId', 'price salePrice productName productImage');

//         if (!cart || !cart.items.length) {
//             return res.status(400).json({ error: 'Cart is empty' });
//         }

//         const totals = calculateTotals(cart.items);
//         let finalAmount = totals.totalPrice;
//         let discount = 0;
//         let appliedCoupon = null;

//         if (couponId) {
//             const coupon = await Coupon.findOne({
//                 _id: couponId,
//                 isList: true,
//                 startOn: { $lte: new Date() },
//                 expireOn: { $gt: new Date() },
//                 minimumPrice: { $lte: totals.totalPrice }
//             });

//             if (coupon) {
//                 discount = coupon.amountType === 'percentage' ? (totals.totalPrice * coupon.offerPrice) / 100 : coupon.offerPrice;
//                 finalAmount -= discount;
//                 appliedCoupon = coupon;
//             }
//         }

//         if (paymentMethod === "Online") {
//             const razorpayOrder = await razorpayInstance.orders.create({
//                 amount: finalAmount * 100,
//                 currency: "INR",
//                 receipt: `order_rcptid_${Date.now()}`,
//                 payment_capture: 1
//             });

//             // Create a pending order in the database with razorpayOrderId
//             const newOrder = new Order({
//                 orderedItems: cart.items.map((item) => ({
//                     product: item.productId._id,
//                     quantity: item.quantity,
//                     price: item.productId.salePrice || item.productId.price,
//                     productDetails: {
//                         productName: item.productId.productName,
//                         productImage: item.productId.productImage
//                     }
//                 })),
//                 size: cart.items[0].size,
//                 totalPrice: totals.totalPrice,
//                 discount: discount,
//                 finalAmount: finalAmount,
//                 address: {
//                     name: selectedAddress.name,
//                     street: selectedAddress.landMark, 
//                     city: selectedAddress.city,
//                     state: selectedAddress.state,
//                     zipCode: selectedAddress.pincode, 
//                     phone: selectedAddress.phone
//                 },
//                 user: userId,
//                 status: paymentMethod === "COD" ? "pending" : "processing", // Order remains pending until payment verification
//                 razorpayOrderId: paymentMethod === "COD" ? null : razorpayOrder.id ,
//                 PaymentMethod: paymentMethod, // Store the Razorpay order ID
//                 invoiceDate: new Date(),
//                 createdOn: new Date(),
//                 couponApplied: !!appliedCoupon,
//                 couponDetails: appliedCoupon ? {
//                     couponId: appliedCoupon._id,
//                     couponName: appliedCoupon.name,
//                     discountAmount: discount
//                 } : null
//             });

//             await newOrder.save(); // Save order with pending status
//             console.log("Pending Order Created:", newOrder);

//             return res.json({
//                 success: true,
//                 orderId: razorpayOrder.id,
//                 amount: finalAmount,
//                 currency: "INR",
//                 key: process.env.RAZORPAY_KEY_ID
//             });
//         } else {
//             const newOrder = new Order({
//                 orderedItems: cart.items.map((item) => ({
//                     product: item.productId._id,
//                     quantity: item.quantity,
//                     price: item.productId.salePrice || item.productId.price,
//                     productDetails: {
//                         productName: item.productId.productName,
//                         productImage: item.productId.productImage
//                     }
//                 })),
//                 size: cart.items[0].size,
//                 totalPrice: totals.totalPrice,
//                 discount: discount,
//                 finalAmount: finalAmount,
//                 address: {
//                     name: selectedAddress.name,
//                     street: selectedAddress.landMark, 
//                     city: selectedAddress.city,
//                     state: selectedAddress.state,
//                     zipCode: selectedAddress.pincode, 
//                     phone: selectedAddress.phone
//                 },
//                 user: userId,
//                 status: "pending",
//                 invoiceDate: new Date(),
//                 createdOn: new Date(),
//                 couponApplied: !!appliedCoupon,
//                 couponDetails: appliedCoupon ? {
//                     couponId: appliedCoupon._id,
//                     couponName: appliedCoupon.name,
//                     discountAmount: discount
//                 } : null
//             });

//             await newOrder.save();
//             console.log("Order Created:", newOrder);

//             await Cart.updateOne({ user: userId }, { $set: { items: [] } });

//             return res.json({
//                 success: true,
//                 orderId: newOrder._id
//             });
//         }
//     } catch (error) {
//         console.error('Error placing order:', error);
//         res.status(500).json({ error: 'Failed to place order' });
//     }
// };


// const  verifyPayment =  async (req, res) => {
//     try {
//         console.log("Received Payment Verification Data:", req.body);

//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//         if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//             console.error("Missing Razorpay Payment Details");
//             return res.status(400).json({ success: false, error: "Invalid payment details" });
//         }

//         const secret = process.env.RAZORPAY_KEY_SECRET;
//         const generated_signature = crypto
//             .createHmac('sha256', secret)
//             .update(razorpay_order_id + "|" + razorpay_payment_id)
//             .digest('hex');

//         if (generated_signature !== razorpay_signature) {
//             console.error("Signature Mismatch");
//             return res.status(400).json({ success: false, error: "Payment verification failed" });
//         }

//         console.log("Signature Verified");

//         const order = await Order.findOneAndUpdate(
//             { razorpayOrderId: razorpay_order_id },
//             { status: "confirmed", razorpayPaymentId: razorpay_payment_id },
//             { new: true }
//         );

//         if (!order) {
//             console.error("Order Not Found for Razorpay Order ID:", razorpay_order_id);
//             return res.status(404).json({ success: false, error: "Order not found" });
//         }

//         console.log("Order Updated After Payment:", order);

//         // Clear cart after payment
//         await Cart.findOneAndDelete({ user: order.user });

//         res.json({ success: true, orderId: order._id });
//     } catch (error) {
//         console.error("Payment verification failed:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper function to update product quantities
async function updateProductQuantities(items) {
    for (const item of items) {
        const product = await Product.findById(item.productId._id);
        if (!product) {
            throw new Error(`Product ${item.productId._id} not found`);
        }

        // Find the specific size in the sizes array and update its quantity
        const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
        if (sizeIndex === -1) {
            throw new Error(`Size ${item.size} not found for product ${item.productId._id}`);
        }

        if (product.sizes[sizeIndex].quantity < item.quantity) {
            throw new Error(`Insufficient quantity for product ${product.productName} in size ${item.size}`);
        }

        product.sizes[sizeIndex].quantity -= item.quantity;

        product.quantity -= item.quantity;

        // Update product status if necessary
        if (product.quantity <= 0) {
            product.status = 'out of stock';
        }

        
        await product.save();
    }
}

const placeOrder = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.status(401).json({ error: "Please login to continue" });
        }

        const userId = req.session.user._id;
        const { addressIndex, paymentMethod, couponId } = req.body;

        // Find address and validate
        const addressDoc = await Address.findOne({ userId });
        if (!addressDoc || !addressDoc.address[addressIndex]) {
            return res.status(400).json({ error: 'Invalid address selected' });
        }

        const selectedAddress = addressDoc.address[addressIndex];
        
        // Find cart and validate
        const cart = await Cart.findOne({ userId })
            .populate('items.productId', 'price salePrice productName productImage sizes');

        if (!cart || !cart.items.length) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate totals and apply coupon
        const totals = calculateTotals(cart.items);

        if (paymentMethod === 'COD' && totals.totalPrice > 1000) {
            return res.status(400).json({ 
                error: 'Cash on Delivery is not available for orders above ₹1,000. Please choose online payment.' 
            });
        }

        let finalAmount = totals.totalPrice;
        let discount = 0;
        let appliedCoupon = null;

        if (couponId) {
            const coupon = await Coupon.findOne({
                _id: couponId,
                isList: true,
                startOn: { $lte: new Date() },
                expireOn: { $gt: new Date() },
                minimumPrice: { $lte: totals.totalPrice }
            });

            if (coupon) {
                discount = coupon.amountType === 'percentage' 
                    ? (totals.totalPrice * coupon.offerPrice) / 100 
                    : coupon.offerPrice;
                finalAmount -= discount;
                appliedCoupon = coupon;
            }
        }

        // Create order object
        const orderData = {
            orderedItems: cart.items.map((item) => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice || item.productId.price,
                size: item.size,
                productDetails: {
                    productName: item.productId.productName,
                    productImage: item.productId.productImage
                }
            })),
            totalPrice: totals.totalPrice,
            discount: discount,
            finalAmount: finalAmount,
            address: {
                name: selectedAddress.name,
                street: selectedAddress.landMark,
                city: selectedAddress.city,
                state: selectedAddress.state,
                zipCode: selectedAddress.pincode,
                phone: selectedAddress.phone
            },
            user: userId,
            status: paymentMethod === "COD" ? "pending" : "processing",
            PaymentMethod: paymentMethod,
            invoiceDate: new Date(),
            createdOn: new Date(),
            couponApplied: !!appliedCoupon,
            couponDetails: appliedCoupon ? {
                couponId: appliedCoupon._id,
                couponName: appliedCoupon.name,
                discountAmount: discount
            } : null
        };


        if (paymentMethod === "Online") {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: finalAmount * 100,
                currency: "INR",
                receipt: `order_rcptid_${Date.now()}`,
                payment_capture: 1
            });
            
            orderData.razorpayOrderId = razorpayOrder.id;
            
            // Create order
            const newOrder = new Order(orderData);
            await newOrder.save();

            // Update product quantities
            await updateProductQuantities(cart.items);

            return res.json({
                success: true,
                orderId: razorpayOrder.id,
                amount: finalAmount,
                currency: "INR",
                key: process.env.RAZORPAY_KEY_ID
            });
        } else if(paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ user: userId });
            if (!wallet || wallet.balance < finalAmount) {
                return res.status(400).json({ 
                    error: 'Insufficient wallet balance' 
                });
            }

            const newOrder = new Order(orderData);
            await newOrder.save();

            // Deduct from wallet
            wallet.balance -= finalAmount;
            wallet.transactions.push({
                amount: finalAmount,
                type: 'debit',
                description: 'Order payment',
                orderId: newOrder._id
            });
            await wallet.save();

            orderData.walletAmountUsed = finalAmount;
            
           

            // Update product quantities
            await updateProductQuantities(cart.items);

            await Cart.findOneAndDelete({ userId });

            return res.json({ success: true, orderId: newOrder._id });
        }else{

            // COD flow
            const newOrder = new Order(orderData);
            await newOrder.save();

            // Update product quantities
            await updateProductQuantities(cart.items);

            // Clear cart
            await Cart.findOneAndDelete({ userId });

            return res.json({
                success: true,
                orderId: newOrder._id
            });
        }
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: error.message || 'Failed to place order' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, error: "Invalid payment details" });
        }

        // Verify signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: "Payment verification failed" });
        }

        // Update order status
        const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { 
                status: "processing",
                razorpayPaymentId: razorpay_payment_id 
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        // Clear cart after successful payment
        await Cart.findOneAndDelete({ userId: order.user });

        res.json({ success: true, orderId: order._id });
    } catch (error) {
        console.error("Payment verification failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};




module.exports = {
    checkOutPage,
    placeOrder,
    verifyPayment
}