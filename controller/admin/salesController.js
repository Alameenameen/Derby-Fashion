const Order = require('../../model/orderSchema');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const moment = require('moment');



const getSalesReport = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'delivered' })
            .populate({
                path: 'orderedItems.product',
                select: 'productName salePrice regularPrice offer'
            });

        // Calculate stats with proper discount calculation
        const totalOrders = orders.length;
        const totalAmount = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
        
        // Calculate total discounts (coupon + product offers)
        const totalDiscount = orders.reduce((sum, order) => {
            let orderDiscount = order.couponDetails?.discountAmount || 0;
            
            // Add product-level discounts
            order.orderedItems.forEach(item => {
                const productDiscount = item.product ? 
                    ((item.product.regularPrice - item.product.salePrice) * item.quantity) : 0;
                orderDiscount += productDiscount;
            });
            
            return sum + orderDiscount;
        }, 0);

        const stats = { totalOrders, totalAmount, totalDiscount };

        res.render('sales', { stats, orders });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};





const downloadReport = async (req, res) => {
    try {
        const { type, format } = req.params;
        const { startDate, endDate } = req.query;
        
        const dateRange = getDateRange(type, startDate, endDate);
        
        let query = { status: 'delivered' };
        if (dateRange) {
            query.createdOn = {
                $gte: dateRange.start,
                $lte: dateRange.end
            };
        }

        const orders = await Order.find(query)
            .populate({
                path: 'orderedItems.product',
                select: 'productName salePrice regularPrice'
            });

        // Calculate summary statistics

        const formatCurrency = (amount) => {
            return `₹${Number(amount).toFixed(2)}`;
        };
       // When calculating summary statistics
       const totalOrders = orders.length;
       const totalSales = orders.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);
       const totalDiscount = orders.reduce((sum, order) => {
           const orderDiscount = order.orderedItems.reduce((itemSum, item) => {
               const regularPrice = Number(item.product?.regularPrice || 0);
               const salePrice = Number(item.product?.salePrice || 0);
               return itemSum + ((regularPrice - salePrice) * item.quantity);
           }, 0);
           return sum + Number(order.couponDetails?.discountAmount || 0) + orderDiscount;
       }, 0);

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            // Title and Date Range
            worksheet.mergeCells('A1:H1');
            worksheet.getCell('A1').value = 'Sales Report';
            worksheet.getCell('A1').font = { size: 16, bold: true };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            worksheet.mergeCells('A2:H2');
            worksheet.getCell('A2').value = `Period: ${moment(dateRange.start).format('YYYY-MM-DD')} to ${moment(dateRange.end).format('YYYY-MM-DD')}`;
            worksheet.getCell('A2').alignment = { horizontal: 'center' };

            // Summary Section
            worksheet.mergeCells('A4:D4');
            worksheet.getCell('A4').value = 'Summary';
            worksheet.getCell('A4').font = { bold: true };

            worksheet.getCell('A5').value = 'Total Orders:';
            worksheet.getCell('B5').value = totalOrders;
            worksheet.getCell('A6').value = 'Total Sales:';
            worksheet.getCell('B6').value = `₹${totalSales.toFixed(2)}`;
            worksheet.getCell('A7').value = 'Total Discount:';
            worksheet.getCell('B7').value = `₹${totalDiscount.toFixed(2)}`;

            // Orders Table
            worksheet.addRow([]); // Empty row for spacing
            
            // Headers
            const headers = [
                'Order ID',
                'Date',
                'Customer',
                'Products',
                'Original Amount',
                'Discount',
                'Final Amount',
                'Payment Method'
            ];
            
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            headerRow.alignment = { horizontal: 'center' };
            
            // Style header row
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Data rows
            orders.forEach(order => {
                const products = order.orderedItems
                    .map(item => `${item.product?.productName || 'Unknown'} x${item.quantity}`)
                    .join(', ');

                const orderDiscount = (order.couponDetails?.discountAmount || 0) +
                    order.orderedItems.reduce((sum, item) => {
                        const regularPrice = item.product?.regularPrice || 0;
                        const salePrice = item.product?.salePrice || 0;
                        return sum + ((regularPrice - salePrice) * item.quantity);
                    }, 0);

                const row = worksheet.addRow([
                    order._id.toString(),
                    moment(order.createdOn).format('YYYY-MM-DD'),
                    order.address.name,
                    products,
                    (order.finalAmount + orderDiscount).toFixed(2),
                    orderDiscount.toFixed(2),
                    order.finalAmount.toFixed(2),
                    order.PaymentMethod
                ]);

                // Style data rows
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            // Set column widths
            worksheet.columns.forEach((column) => {
                column.width = 15;
            });
            worksheet.getColumn(4).width = 40; // Products column wider

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=sales_report_${moment().format('YYYY-MM-DD')}.xlsx`);
            
            await workbook.xlsx.write(res);
            res.end();
        } 
        else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=sales_report_${moment().format('YYYY-MM-DD')}.pdf`);
            
            doc.pipe(res);

            // Helper function for table layout
            const createTable = (doc, headers, rows, startX, startY, options = {}) => {
                const columnWidth = options.columnWidth || 100;
                const rowHeight = options.rowHeight || 20;
                let currentX = startX;
                let currentY = startY;

                // Draw headers
                headers.forEach((header, i) => {
                    doc.font('Helvetica-Bold')
                       .fontSize(10)
                       .text(header, currentX, currentY, {
                           width: columnWidth,
                           align: 'center'
                       });
                    currentX += columnWidth;
                });

                currentY += rowHeight;

                // Draw rows
                rows.forEach((row) => {
                    currentX = startX;
                    row.forEach((cell) => {
                        doc.font('Helvetica')
                           .fontSize(9)
                           .text(cell.toString(), currentX, currentY, {
                               width: columnWidth,
                               align: 'center'
                           });
                        currentX += columnWidth;
                    });
                    currentY += rowHeight;
                });

                // Draw lines
                doc.lineWidth(1);
                
                // Vertical lines
                for (let i = 0; i <= headers.length; i++) {
                    doc.moveTo(startX + (i * columnWidth), startY)
                       .lineTo(startX + (i * columnWidth), currentY)
                       .stroke();
                }

                // Horizontal lines
                for (let i = 0; i <= rows.length + 1; i++) {
                    doc.moveTo(startX, startY + (i * rowHeight))
                       .lineTo(startX + (headers.length * columnWidth), startY + (i * rowHeight))
                       .stroke();
                }
            };

            // Title and Date Range
            doc.fontSize(18).text('Sales Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Period: ${moment(dateRange.start).format('YYYY-MM-DD')} to ${moment(dateRange.end).format('YYYY-MM-DD')}`, { align: 'center' });
            doc.moveDown();

            // Summary Section
            doc.fontSize(14).text('Summary', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10)
               .text(`Total Orders: ${totalOrders}`)
               .text(`Total Sales: ${formatCurrency(totalSales)}`)  // Using formatCurrency function
               .text(`Total Discount: ${formatCurrency(totalDiscount)}`);  // Using formatCurrency function
            
            doc.moveDown();

            // Orders Table
            const headers = ['Order ID', 'Date', 'Customer', 'Amount', 'Payment'];
            const tableRows = orders.map(order => [
                order._id.toString().slice(-6),
                moment(order.createdOn).format('YYYY-MM-DD'),
                order.address.name,
                formatCurrency(order.finalAmount),  // Using formatCurrency function
                order.PaymentMethod
            ]);

            createTable(doc, headers, tableRows, 50, doc.y, { 
                columnWidth: 100,
                rowHeight: 25
            });

            doc.end();
        } else {
            res.status(400).json({ success: false, message: 'Invalid format' });
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
};



const generateReport = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.body;
        let dateRange;

        if (type === 'custom' && startDate && endDate) {
            dateRange = {
                start: new Date(startDate),
                end: new Date(endDate + 'T23:59:59.999Z') // Include the full end date
            };
        } else {
            dateRange = getDateRange(type);
        }

        if (!dateRange) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid date range" 
            });
        }

        const orders = await Order.find({
            createdOn: { 
                $gte: dateRange.start, 
                $lte: dateRange.end 
            },
            status: 'delivered'
        })
        .populate({
            path: 'orderedItems.product',
            select: 'productName salePrice regularPrice offer'
        });

        // Calculate total discounts for each order
        const ordersWithDiscounts = orders.map(order => {
            const orderData = order.toObject();
            
            // Calculate total discount for this order
            const totalDiscount = (order.couponDetails?.discountAmount || 0) +
                order.orderedItems.reduce((sum, item) => {
                    const regularPrice = item.product?.regularPrice || 0;
                    const salePrice = item.product?.salePrice || 0;
                    return sum + ((regularPrice - salePrice) * item.quantity);
                }, 0);

            orderData.totalDiscount = totalDiscount;
            return orderData;
        });

        res.json({ 
            success: true, 
            orders: ordersWithDiscounts,
            dateRange // Send back the date range for verification
        });
    } catch (error) {
        console.error('Generate Report Error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching report",
            error: error.message 
        });
    }
};



function getDateRange(type, startDate, endDate) {
    const today = new Date();
    
    // Handle custom date range if startDate and endDate are provided
    if (startDate && endDate) {
        return {
            start: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            end: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
    }
    
    // Handle predefined ranges
    switch (type) {
        case 'daily':
            return {
                start: new Date(new Date().setHours(0, 0, 0, 0)),
                end: new Date(new Date().setHours(23, 59, 59, 999))
            };
        case 'weekly': {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            return {
                start: new Date(start.setHours(0, 0, 0, 0)),
                end: new Date(new Date().setHours(23, 59, 59, 999))
            };
        }
        case 'monthly': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return {
                start: new Date(start.setHours(0, 0, 0, 0)),
                end: new Date(new Date().setHours(23, 59, 59, 999))
            };
        }
        case 'yearly': {
            const start = new Date(today.getFullYear(), 0, 1);
            return {
                start: new Date(start.setHours(0, 0, 0, 0)),
                end: new Date(new Date().setHours(23, 59, 59, 999))
            };
        }
        case 'custom':
            // If type is custom but no dates provided, return last 30 days
            const start = new Date();
            start.setDate(start.getDate() - 30);
            return {
                start: new Date(start.setHours(0, 0, 0, 0)),
                end: new Date(new Date().setHours(23, 59, 59, 999))
            };
        default:
            // Instead of returning null, return last 30 days as default
            const defaultStart = new Date();
            defaultStart.setDate(defaultStart.getDate() - 30);
            return {
                start: new Date(defaultStart.setHours(0, 0, 0, 0)),
                end: new Date(new Date().setHours(23, 59, 59, 999))
            };
    }
}






module.exports = {
    getSalesReport,
    generateReport,
    downloadReport
};
