import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import {PDFParse} from "pdf-parse";
import { SystemMessage,HumanMessage } from "@langchain/core/messages";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 5000;

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
});

let vectorStore;

const upload = async () => {
  const pdfPath = "./knowledge.pdf";

  const buffer = fs.readFileSync(pdfPath);
  
  const pdfresult = new PDFParse({data:buffer});
  const result= await pdfresult.getText()
  const text = result.text;
 

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 500,
  });

  const docs = await splitter.createDocuments([text]);

  await vectorStore.addDocuments(docs);
};

async function init() {
  vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: "langchainjs-testing",
    }
  );

//   await upload(); if you want to upload
}

init();

app.post("/ai", async (req, res) => {
  try {
    const { input } = req.body;


    const docs = await vectorStore.similaritySearch(input,5)
    const context=docs.map((d)=>d.pageContent).join('/n')


    const response = await llm.invoke([
  new SystemMessage(`You are a RAG AI assistant.

STRICT RULES:
- Answer ONLY from context
- Do not use outside knowledge
- If answer not found say:
  "I don't know from uploaded PDF."

Context:
${context}
`),

new HumanMessage(input)
]);

   

    return res.status(200).json({
     ai:response.content
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});