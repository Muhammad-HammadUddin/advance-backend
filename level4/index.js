import express from "express";

import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();

const app=express()
app.use(express.json())
const port= process.env.PORT || 5000
const ai= new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})




app.post("/ai",async(req,res)=>{
    const {input}=req.body
    const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
        {role:"system",
            parts:[{text:'you are a assistant and yout name is Hammad'}]
        },
        {role:"user",
            parts:[{text:input}]
        }
    ]
  });
  return res.send({ ai: response.text })
})

app.get("/",(req,res)=>{
    res.send("Hello World")
})
app.listen(port,()=>{
    console.log(`Server is running on port ${port} and it is an express server`)
})