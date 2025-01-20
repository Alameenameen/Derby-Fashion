const mongoose = require('mongoose')
const Order = require('../../model/orderSchema');
const Address = require('../../model/addressSchema');
const Product = require('../../model/productSchema')

const orderSuccessPage = async (req, res) => {
    try {
        // console.log("user Id",req.session.user._id)
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }

        const orderId = req.params.orderId;
        console.log("orderrrid:",orderId)

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.render('page-404', {
                user: req.session.user,
                error: 'Invalid order ID',
                page: 'page-404'
            });
        }

        // Fetch order with populated product details
        const order = await Order.findById({ _id:orderId }).populate('orderedItems.product').populate('user')
            // console.log("orders:",order)
         
        //  console.log(order.product.productImage)


        if (!order) {
            return res.render('page-404', {
                user: req.session.user,
                error: 'Order not found',
                page: 'page-404'
            });
        }

     

      

        res.render('order-details', {
            order: order,
            user: req.session.user,
            // address: order.address 
        });

        // console.log("orders:",order)

    } catch (error) {
        console.error('Error loading order details:', error);
        res.render('page-404', {
            user: req.session.user,
            error: 'Error loading order details',
            page:'page-404'
        });
    }
};



// // Handle order cancellation
// const cancelOrder = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;
//         const order = await Order.findById({_id:orderId });
//         console.log("cancelled:",orderId)

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Order not found'
//             });
//         }

//         if (order.status !== 'pending') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Only pending orders can be cancelled'
//             });
//         }


//         if (order.isCancelledByUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Order is already cancelled.",
//             });
//         }

//         for (const item of order.orderedItems) {
//             const product = await Product.findById(item.product._id);

//             if (!product) continue;


//             console.log('Before quantity restoration:', {
//                 productId: product._id,
//                 currentTotalQuantity: product.quantity,
//                 orderQuantity: item.quantity,
//                 currentSizes: product.sizes,
//                 orderSize: order.size // Using size from root level of order
//             });

//             // Restore total stock
//             product.quantity += item.quantity;

            
//             // Now handle size-specific quantity restoration
//             // We need to find the size from the order item and update that specific size's quantity
//             if (order.size) {  // Make sure we have size information
//                 const sizeIndex = product.sizes.findIndex(s => s.size === order.size);
                
//                 if (sizeIndex !== -1) {
//                     // Add back the quantity to the specific size
//                     product.sizes[sizeIndex].quantity += item.quantity;
//                     console.log(`Restored ${item.quantity} items to size ${order.size}`);
//                 }
//             }

//             // Update product status if it was out of stock
//             if (product.status === 'out of stock' && product.quantity > 0) {
//                 product.status = 'Available';
//             }


//             await product.save();
//         }


//         order.status = 'cancelled';
//         order.isCancelledByUser = true;
//         await order.save();

//         res.json({ success: true });

//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to cancel order'
//         });
//     }
// };

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        
        // Find the order and populate necessary product details
        const order = await Order.findById(orderId).populate({
            path: 'orderedItems.product',
            select: 'productName quantity sizes status'
        });

        // Basic validation to ensure order exists and can be cancelled
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending orders can be cancelled'
            });
        }

        if (order.isCancelledByUser) {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled."
            });
        }

        // Process each ordered item to restore quantities
        for (const orderItem of order.orderedItems) {
            // Find the corresponding product
            const product = await Product.findById(orderItem.product._id);
            
            if (!product) {
                console.log(`Product not found for order item: ${orderItem._id}`);
                continue;
            }

            // Log initial state for debugging
            console.log('Before quantity restoration:', {
                productId: product._id,
                currentTotalQuantity: product.quantity,
                orderQuantity: orderItem.quantity,
                currentSizes: product.sizes,
                orderSize: order.size // Using size from root level of order
            });

            // Restore the total product quantity
            product.quantity += orderItem.quantity;

            // Find and update the specific size quantity using the order-level size
            if (order.size) {
                const sizeIndex = product.sizes.findIndex(s => s.size === order.size);
                
                if (sizeIndex !== -1) {
                    // Restore the quantity for this specific size
                    product.sizes[sizeIndex].quantity += orderItem.quantity;
                    
                    console.log('Size quantity restored:', {
                        size: order.size,
                        quantityRestored: orderItem.quantity,
                        newSizeQuantity: product.sizes[sizeIndex].quantity
                    });
                } else {
                    console.log(`Warning: Size ${order.size} not found in product sizes`);
                }
            }

            // Update product status if it was out of stock
            if (product.status === 'out of stock' && product.quantity > 0) {
                product.status = 'Available';
            }

            // Save the updated product
            await product.save();

            // Log final state for verification
            console.log('After quantity restoration:', {
                productId: product._id,
                newTotalQuantity: product.quantity,
                updatedSizes: product.sizes
            });
        }

        // Update the order status
        order.status = 'cancelled';
        order.isCancelledByUser = true;
        await order.save();

        res.json({ 
            success: true,
            message: 'Order cancelled successfully and quantities restored'
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel order',
            details: error.message
        });
    }
};


// Handle return requests
const requestReturn = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                error: 'Only delivered orders can be returned'
            });
        }

        order.status = 'Return Request';
        await order.save();

        res.json({ success: true });

    } catch (error) {
        console.error('Error requesting return:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to request return'
        });
    }
};



const getUserOrders = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }

        // Fetch orders with populated product details
        const orders = await Order.find({ user: req.session.user._id })
            .populate('orderedItems.product')
            .populate('user')
            .sort({ createdOn: -1 }) // Most recent orders first
            .lean();


            console.log(orders)

        // Format orders for display
        const formattedOrders = orders.map(order => {
            // Calculate total items in order
            const totalItems = order.orderedItems.reduce((sum, item) => sum + item.quantity, 0);
            
            return {
                orderId: order._id,
                date: new Date(order.createdOn).toLocaleDateString(),
                status: order.status,
                total: order.finalAmount,
                paymentMethod: order.PaymentMethod,
                itemCount: totalItems,
                canReturn: order.status === 'delivered' && 
                          new Date() - new Date(order.createdOn) < 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
            };
        });

        console.log("FORMA",formattedOrders)

        return res.render('user/profile', {
            orders: formattedOrders,
            user: req.session.user,
            activeTab: 'orders'
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).render('error', {
            user: req.session.user,
            error: 'Error fetching orders'
        });
    }
};

module.exports = {
    orderSuccessPage,
    cancelOrder,
    requestReturn,
    getUserOrders
};