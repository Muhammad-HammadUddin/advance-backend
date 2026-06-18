import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import rateLimiter from "./middleware/ratelimit.js"
import Redis from "ioredis";
import User from "./model/usermodel.js";
import sendEmail from "./lib/sendEmail.js";
import emailQueue from "./queue.js"
dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);
dotenv.config();

const app = express();
const redis = new Redis(process.env.REDIS_URL,{
     maxRetriesPerRequest: null
});

app.use(express.json());


app.post('/create',async(req,res)=>{

       const {name,email,password}=req.body
       const user=await User.create({name,email,password});
       emailQueue.add("send-email",{email})
       await redis.del("users");
       res.status(201).json(user);

})

app.get('/get',rateLimiter,async(req,res)=>{

       const user=await User.find({});
       res.status(201).json(user);
})


app.get('/cache',async(req,res)=>{

    const cached =await redis.get("users");
    if(cached){
        console.log("Data retrieved from cache");
        return res.json(JSON.parse(cached))
    }
    const user= await User.find({});
    await redis.set("users",JSON.stringify(user));
    console.log("Data retrieved from database and stored in cache");
    return res.json(user)
})




app.post("/otp",async(req,res)=>{
        const {email}=req.body

        const otp=Math.floor(100000+Math.random()*900000).toString()

        await redis.set(`otp:${email}`,otp,"EX",30)
        console.log(`OTP for ${email} is ${otp}`)
        res.json({message:"OTP sent to email"}) 


})
app.post("/verify-otp",async(req,res)=>{
        const {email,otp}=req.body
        const cachedOtp=await redis.get(`otp:${email}`)
        if(cachedOtp===otp){
            await redis.del(`otp:${email}`)
            res.json({message:"OTP verified successfully"})
        }
        else{
            res.status(400).json({message:"Invalid OTP"})
        }
     }) 



mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB Connected Successfully ✅");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB ❌");
    console.log(error.message);
  });

app.get("/", (req, res) => {
  res.send("Server running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default redis;