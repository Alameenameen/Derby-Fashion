const User = require("../../model/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const pageError = async(req,res)=>{
    res.render("admin-error")
}



const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    return res.render("admin-login",{message:null})
}



const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate email
        if (!email) {
            return res.render("admin-login", { message: "Email is required" });
        }
        // Find the admin user
        const admin = await User.findOne({ email, isAdmin: true });
        // If admin not found, return an error message
        if (!admin) {
            return res.render("admin-login", { message: "Invalid email or user does not exist" });
        }
        // Compare the provided password with the stored hash
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.render("admin-login", { message: "Incorrect password" });
        }

        // If credentials are valid, set the session and redirect
        req.session.admin = true;
        return res.redirect("/admin");
    } catch (error) {
        console.error("Login error:", error);
        return res.redirect("/pageerror");
    }
};



const loadDashboard = async(req,res)=>{
   if(req.session.admin){
    try {
        res.render("dashboard");
    } catch (error) {
        res.redirect("/pageerror")
    }
   }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session",err);
                return res.redirect("/pageerror")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log(("unexpected error during logout",error))
        res.redirect("/pageerror")
    }
}



module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout
}