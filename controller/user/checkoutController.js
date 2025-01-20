const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");
const User = require("../../model/userSchema");
const Cart = require("../../model/cartSchema")
const Address = require("../../model/addressSchema")
const Order = require("../../model/orderSchema")


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
    const tax = subtotal * 0.10;  // 10% tax
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


        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id);

            if (!product) continue;

            // Deduct total stock
            product.quantity -= item.quantity;

            // Deduct size-specific quantities
            const sizeDetail = product.sizes.find(s => s.size === item.size); // Match size directly
            if (sizeDetail) {
                sizeDetail.quantity -= item.quantity; // Deduct quantity for the matched size
            }

            // Update product status if out of stock
            if (product.quantity <= 0) {
                product.status = 'out of stock';
            }

            await product.save();
        }
        // Fetch user addresses
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

const placeOrder = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.status(401).json({ error: "Please login to continue" });
        }

        const userId = req.session.user._id;
        const { addressIndex, paymentMethod } = req.body;

        // Fetch address document
        const addressDoc = await Address.findOne({ userId });
        if (!addressDoc || !addressDoc.address[addressIndex]) {
            return res.status(400).json({ error: 'Invalid address selected' });
        }

        // Get the selected address from the array
        const selectedAddress = addressDoc.address[addressIndex];

        // Fetch cart with populated product details
        const cart = await Cart.findOne({ userId })
            .populate('items.productId', 'price salePrice');

        if (!cart || !cart.items.length) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate totals
        const totals = calculateTotals(cart.items);

        // Create the new order
        const newOrder = new Order({
            orderedItems: cart.items.map((item) => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice || item.productId.price,
                productDetails: {
                    productName: item.productId.productName,
                    productImage: item.productId.productImage
                }
            })),
            size: cart.items[0].size,
            totalPrice: totals.totalPrice,
            discount: totals.discount,
            finalAmount: totals.finalAmount,
            address: {
                name: selectedAddress.name,
                street: selectedAddress.landMark, 
                city: selectedAddress.city,
                state: selectedAddress.state,
                zipCode: selectedAddress.pincode, 
                phone: selectedAddress.phone
            },
            user:userId,
            status: paymentMethod === "COD" ? "pending" : "processing",
            invoiceDate: new Date(),
            createdOn: new Date(),
            couponApplied: false
        });       
        console.log('New order data:', {
            size: newOrder.size,
            items: newOrder.orderedItems
        });
        
        await newOrder.save();
        console.log("details",newOrder)
        // Clear cart after order placement
        await Cart.findOneAndDelete({ userId });

        res.json({
            success: true,
            message: 'Order placed successfully!',
            orderId: newOrder._id
        });

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
}



module.exports = {
    checkOutPage,
    placeOrder
}