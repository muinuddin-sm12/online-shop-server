const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 8000;

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://online-shop-client-sigma.vercel.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ff1pkvw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const productCollection = client.db("onlineShopDB").collection("products");
    const userCollection = client.db("onlineShopDB").collection("users");

    // save an user in dataBase
    app.post("/users", async (req, res) => {
      const userData = req.body;
      const result = await userCollection.insertOne(userData);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/products", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || "";

        const query = searchQuery
          ? { Name: { $regex: searchQuery, $options: "i" } }
          : {};
        const result = await productCollection.countDocuments(query);
        const prodcts = await productCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray();

        res.json({
          prodcts,
          totalPages: Math.ceil(result / limit),
          currentPage: page,
        });
      } catch (error) {
        console.log("Error fetching products", error);
      }
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from Online Shop Server....");
});
app.listen(port, () => console.log(`Server running on port ${port}`));
