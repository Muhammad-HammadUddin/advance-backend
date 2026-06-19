import express from "express";

import dotenv from "dotenv";

dotenv.config();

const app=express()
const port= process.env.PORT || 5000

app.get("/",(req,res)=>{
    res.send(`Hello from ${process.env.SERVER_NAME}`)
})
app.listen(port,()=>{
    console.log(`Server is running on port ${port} and it is an express server`)
})