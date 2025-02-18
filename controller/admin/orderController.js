const Order = require('../../model/orderSchema');
const Product = require('../../model/productSchema');
const Address = require('../../model/addressSchema');
const Wallet = require('../../model/walletSchema');



    // Get all orders
    const getAllOrders = async (req, res) => {
        try {

            const { startDate, endDate, status } = req.query;
        
            // Build filter object
            let filter = {};
            
            // Add date filter if both dates are provided
            if (startDate && endDate) {
                filter.createdOn = {
                    $gte: new Date(startDate),
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59))
                };
            }
            
            // Add status filter if provided
            if (status && status !== 'all') {
                filter.status = status;
            }

            const orders = await Order.find(filter)
                .populate({
                    path: 'orderedItems.product',
                    select: 'productName productImage salePrice'
                })
                .populate('user', 'name email')
                .sort({ createdOn: -1 });
    

                // console.log("total orders:",orders)
            // Pass additional details like status if needed
            res.render('orders', {
                orders,  // Rendered data
                currentPage: 'orders',
                filters: {
                    startDate: startDate || '',
                    endDate: endDate || '',
                    status: status || ''
                }  
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching orders',
                error: error.message
            });
        }
    };
    
    const processRefund = async (orderId, userId, amount, reason) => {
        try {
            const order = await Order.findById(orderId);
            if (!order) throw new Error('Order not found');
    
            // Find or create wallet with proper error handling
            let wallet = await Wallet.findOne({ user: userId });
            console.log('wallet before:', wallet);
    
            if (!wallet) {
                wallet = new Wallet({ 
                    user: userId,
                    balance: 0,
                    transactions: []
                });
                // Save the new wallet first
                await wallet.save();
                console.log('Created new wallet');
            }
    
            // Ensure amount is a number
            const refundAmount = Number(amount);
            if (isNaN(refundAmount) || refundAmount <= 0) {
                throw new Error(`Invalid refund amount: ${amount}`);
            }
    
            // Update wallet with transaction
            wallet.balance += refundAmount;
            wallet.transactions.push({
                amount: refundAmount,
                type: 'credit',
                description: reason,
                orderId: orderId,
                timestamp: new Date()
            });
    
            // Save wallet changes
            const updatedWallet = await wallet.save();
            console.log('Updated wallet balance:', updatedWallet.balance);
    
            // Update order status
            order.refundStatus = {
                isRefunded: true,
                refundedAmount: refundAmount,
                refundedAt: new Date(),
                refundMethod: 'wallet'
            };
    
            await order.save();
    
            console.log(`Refund processed successfully: Amount ${refundAmount} credited to wallet for order ${orderId}`);
            return true;
        } catch (error) {
            console.error('Refund processing error:', error);
            throw error; // Re-throw to handle it in the calling function
        }
    };


    // const updateOrderStatus = async (req, res) => {
    //     try {
    //         const orderId = req.params.id;
    //         const { status } = req.body;
    
    //         const existingOrder = await Order.findById(orderId);
    
    //         if (!existingOrder) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'Order not found'
    //             });
    //         }
    
    //         // Check if order is cancelled
    //         if (existingOrder.isCancelledByUser) {
    //             return res.status(403).json({
    //                 success: false,
    //                 message: "Order has been cancelled by the user. Status updates are not allowed."
    //             });
    //         }
    
    //         // Check if current status is delivered, Return Request, or Returned
    //         if ((existingOrder.status === 'delivered' || 
    //              existingOrder.status === 'Return Request' || 
    //              existingOrder.status === 'Returned') && 
    //             status !== 'Return Request' && 
    //             status !== 'Returned') {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'Only Return Request or Returned status are allowed at this stage'
    //             });
    //         }
    
    //         // Update the order
    //         const updateData = status === 'delivered' 
    //             ? { status, deliveredDate: new Date() }
    //             : { status };
    
    //         const updatedOrder = await Order.findByIdAndUpdate(
    //             orderId,
    //             updateData,
    //             { new: true }
    //         );
    
    //         res.status(200).json({
    //             success: true,
    //             message: 'Order status updated successfully',
    //             order: updatedOrder
    //         });
    
    //     } catch (error) {
    //         console.error('Error updating order status:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error updating order status',
    //             error: error.message
    //         });
    //     }
    // };



    const updateOrderStatus = async (req, res) => {
        try {
            const orderId = req.params.id;
            const { status } = req.body;
    
            const existingOrder = await Order.findById(orderId)
                .populate({
                    path: 'orderedItems.product',
                    select: '_id productName quantity sizes status'
                });
    
            if (!existingOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
    
            // Check if order is cancelled
            if (existingOrder.isCancelledByUser) {
                return res.status(403).json({
                    success: false,
                    message: "Order has been cancelled by the user. Status updates are not allowed."
                });
            }
    
            // Check if current status is delivered, Return Request, or Returned
            if ((existingOrder.status === 'delivered' ||
                 existingOrder.status === 'Return Request' ||
                 existingOrder.status === 'Returned') &&
                status !== 'Return Request' &&
                status !== 'Returned') {
                return res.status(400).json({
                    success: false,
                    message: 'Only Return Request or Returned status are allowed at this stage'
                });
            }
    
            // Process refund and restore inventory when status is changed to "Returned"
            if (status === 'Returned' && existingOrder.status === 'Return Request') {
                try {
                    // Process refund
                    console.log(`Processing refund for return, order ${orderId}, amount: ${existingOrder.finalAmount}`);
                    const refundSuccess = await processRefund(
                        orderId,
                        existingOrder.user,
                        existingOrder.finalAmount,
                        'Refund for returned order'
                    );
                    
                    if (!refundSuccess) {
                        throw new Error('Failed to process refund for return');
                    }
                    console.log('Return refund processed successfully');
    
                    // Restore inventory quantities
                    for (const orderItem of existingOrder.orderedItems) {
                        try {
                            const quantityToRestore = parseInt(orderItem.quantity, 10);
                            if (isNaN(quantityToRestore)) {
                                console.error('Invalid quantity format:', orderItem.quantity);
                                continue;
                            }
    
                            const productId = orderItem.product._id || orderItem.product;
                            const product = await Product.findById(productId);
    
                            if (!product) {
                                console.error(`Product not found for ID: ${productId}`);
                                continue;
                            }
    
                            // Update total quantity
                            const updatedQuantity = product.quantity + quantityToRestore;
    
                            // Update size-specific quantity
                            let updatedSizes = [...product.sizes];
                            if (orderItem.size) {
                                const sizeIndex = updatedSizes.findIndex(s => s.size === orderItem.size);
                                if (sizeIndex !== -1) {
                                    updatedSizes[sizeIndex].quantity += quantityToRestore;
                                } else {
                                    updatedSizes.push({
                                        size: orderItem.size,
                                        quantity: quantityToRestore
                                    });
                                }
                            }
    
                            // Update product in database
                            await Product.findByIdAndUpdate(
                                productId,
                                {
                                    $set: {
                                        quantity: updatedQuantity,
                                        sizes: updatedSizes,
                                        status: updatedQuantity > 0 ? 'Available' : 'out of stock'
                                    }
                                }
                            );
                        } catch (error) {
                            console.error('Error restoring quantity:', error);
                            // Continue with other items even if one fails
                            continue;
                        }
                    }
                } catch (error) {
                    console.error('Error processing return:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error processing return and refund',
                        error: error.message
                    });
                }
            }
    
            // Update the order
            const updateData = status === 'delivered'
                ? { status, deliveredDate: new Date() }
                : { status };
    
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                updateData,
                { new: true }
            );
    
            res.status(200).json({
                success: true,
                message: 'Order status updated successfully',
                order: updatedOrder
            });
    
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating order status',
                error: error.message
            });
        }
    };


    const getOrderDetails = async (req, res) => {
        try {
            const orderId = req.params.id;
            const order = await Order.findById(orderId)
                .populate({
                    path: 'orderedItems.product',
                    select: 'productName productImage salePrice'
                })
                .populate('user', 'name email')
                .populate('address');
    
            if (!order) {
                return res.status(404).render('error', {
                    message: 'Order not found',
                    currentPage: 'orders'
                });
            }
    
            // Calculate total amount if it's not already present
            const totalAmount = order.orderedItems.reduce((total, item) => {
                return total + (item.product.salePrice * item.quantity);
            }, 0);
    
            // Combine the order data with calculated total
            const orderData = {
                ...order.toObject(),
                totalAmount: totalAmount
            };
    
            console.log("Order Data:", orderData); // For debugging
    
            res.render('orderdetails', {
                order: orderData,
                currentPage: 'orders'
            });
        } catch (error) {
            console.error('Error fetching order details:', error);
            res.status(500).render('error', {
                message: 'Error fetching order details',
                currentPage: 'orders'
            });
        }
    };

module.exports = {
    getAllOrders,
    updateOrderStatus,
    getOrderDetails,
    processRefund
}