import express from "express";
import dotenv from "dotenv";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
} from "@langchain/langgraph";

import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 5000;

const tool = new TavilySearch({
  maxResults: 2,
  topic: "general",
});

const tools = [tool];

const toolNode = new ToolNode(tools);

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.7,
}).bindTools(tools);

const shouldContinue = (state) => {
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  return "__end__";
};

const callLLM = async (state) => {
  const response = await llm.invoke([
    {
      role: "system",
      content: "You are a helpful assistant",
    },
    ...state.messages,
  ]);

  return {
    messages: [response],
  };
};

const memory = new MemorySaver();

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callLLM)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .compile({
    checkpointer: memory,
  });

app.post("/ai", async (req, res) => {
  try {
    const { input } = req.body;

    const response = await graph.invoke(
      {
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
      },
      {
        configurable: {
          thread_id: "demo-thread-1",
        },
      }
    );

    const lastMessage =
      response.messages[response.messages.length - 1];

    return res.status(200).json({
      ai: lastMessage.content,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(
    `Server is running on port ${port} and it is an express server`
  );
});