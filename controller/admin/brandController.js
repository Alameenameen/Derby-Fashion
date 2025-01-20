const Brand = require('../../model/brandSchema'); // Assuming Brand model exists
const fs = require('fs');
const path = require('path');

// Add a new brand
const addBrand = async (req, res) => {
    try {
        const { brandName } = req.body;
        if (!req.file) {
            throw new Error('Image is required');
        }

        if (!brandName) {
            return res.status(400).json({ error: "Brand name is required." });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        // Check if brand exists
        const existingBrand = await Brand.findOne({ brandName });
        if (existingBrand) {
            return res.status(400).json({ error: "Brand already exists." });
        }

        const newBrand = new Brand({
            brandName: req.body.brandName,
            brandImage: [imagePath], // Store as array since your schema expects array
            isBlocked: false
        });
        
        await newBrand.save();
        res.redirect('/admin/brands'); // Redirect to brands page
    } catch (error) {
        console.error("Error adding brand:", error.message);
        res.status(500).redirect('/admin/pageerror'); // Redirect to error page if something goes wrong
    }
};

// Get all brands
const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find(); // Get all brands from database
        res.render('brand', { brands }); // Render brands page with brands data
    } catch (error) {
        console.error('Error fetching brands:', error.message);
        res.status(500).redirect('/admin/pageerror'); // Redirect to error page if something goes wrong
    }
};

// Block or unblock a brand
const toggleBrandStatus = async (req, res) => {
    try {
        const { brandId } = req.params;
        const brand = await Brand.findById(brandId);

        if (!brand) {
            return res.status(404).json({ error: "Brand not found." });
        }

        // Toggle the status
        brand.isBlocked = !brand.isBlocked;
        await brand.save();
        res.redirect('/admin/brands'); // Redirect to brands page
    } catch (error) {
        console.error('Error toggling brand status:', error.message);
        res.status(500).redirect('/admin/pageerror'); // Redirect to error page
    }
};

// Delete a brand
const deleteBrand = async (req, res) => {
    try {
        const { brandId } = req.params;
        const brand = await Brand.findByIdAndDelete(brandId);

        if (!brand) {
            return res.status(404).json({ error: "Brand not found." });
        }

        // If the brand had an image, delete it from the server
        if (brand.logo) {
            const filePath = path.join(__dirname, '../public/uploads', brand.logo);
            fs.unlinkSync(filePath);
        }

        res.redirect('/admin/brands'); // Redirect to brands page
    } catch (error) {
        console.error('Error deleting brand:', error.message);
        res.status(500).redirect('/admin/pageerror'); // Redirect to error page
    }
};

module.exports = { addBrand, getBrands, toggleBrandStatus, deleteBrand };
