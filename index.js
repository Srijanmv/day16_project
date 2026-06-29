const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
dotenv.config();

const User = require("./models/User");
const authMiddleware = require("./middleware/authMiddleware");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("DB CONNECTED SUCCESSFULLY");
})
.catch((err)=>{
    console.log("Unable to connect to DB", err);
});

app.post("/api/register", async(req, res) =>{
    try{
        const { name, email, password } = req.body;
        const oldUser = await User.findOne({email});
        if(oldUser){
            return res.json({
                success:false,
                message:"User Already Exist"
            });
        }
        const hashPassword = await bcryptjs.hash(password, 10);
        const user = await User.create({ name, email, password: hashPassword });
        res.json({
            success:true,
            message: "User registered Successfully",
            user
        })
    }
    catch (err) {
        console.log("Unable to Register", err);
    }
});

app.post("/api/login",async (req,res) => {
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.json({
                success:false,
                message:"USER NOT FOUND"
            });
        }
        //WE WILL WRITE BELOW THIS
        const isMatch = await bcryptjs.compare(password,user.password);

        if(!isMatch){
            return res.json({
                success:false,
                message:"invalid password"
            });
        }
        const token = jwt.sign({
            id:user._id,email:user.email
        },process.env.SECRET_KEY,{ expiresIn:"2d" });

        res.cookie("token",token,{httpOnly: true});

        res.json({
            success:true,
            message:"Login Successful"
        })
    }
     catch (err) {
        console.log("Unable to login", err);
    }
});

app.get("/api/home",authMiddleware, (req,res) => {
    res.json({
        success:true,
        message:"Welcome to Home page",
        user: req.user
    });
});

app.get("/api/logout",(req,res) => {
    res.clearCookie("token");
    res.json({
        success: true,
        message: "Logout Successfully" 
})
})

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log("Server Started at " + PORT);
});