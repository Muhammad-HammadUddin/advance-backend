import express from "express";
import cors from "cors";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

const typeDefs = `#graphql
  type User{
    id:ID!
    name:String!
    username:String!
    email:String!
    phone:String!
    website:String!
  }

  type Todo {
    id: ID!
    title: String!
    completed: Boolean
    user: User
  }

  type Query {
    getTodos: [Todo]
    getUsers: [User]
    getUser(id:ID!): User
  }
`;

const resolvers = {
  Todo: {
    user: async (todo) => {
      console.log("🔍 Fetching user for todo:", todo.id);

      try {
        const resp = await axios.get(
          `https://jsonplaceholder.typicode.com/users/${todo.userId}`
        );

        console.log("✅ User fetched:", resp.data.id);
        return resp.data;
      } catch (err) {
        console.log("❌ User fetch error:", err.message);
        return null;
      }
    }
  },

  Query: {
    getTodos: async () => {
      console.log("📡 Fetching TODOS...");

      try {
        const resp = await axios.get(
          "https://jsonplaceholder.typicode.com/todos?limit=20"
        );

        console.log("✅ Todos fetched:", resp.data.length);
        return resp.data;
      } catch (err) {
        console.log("❌ Todos error:", err.message);
        return [];
      }
    },

    getUsers: async () => {
      console.log("📡 Fetching USERS...");

      const resp = await axios.get(
        "https://jsonplaceholder.typicode.com/users"
      );

      return resp.data;
    },

    getUser: async (parent, { id }) => {
      console.log("📡 Fetching USER ID:", id);

      const resp = await axios.get(
        `https://jsonplaceholder.typicode.com/users/${id}`
      );

      return resp.data;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use("/graphql", expressMiddleware(server));

app.listen(8000, () => {
  console.log("🚀 Server running on http://localhost:8000/graphql");
});