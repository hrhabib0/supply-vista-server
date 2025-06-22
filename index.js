const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// middleWar
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hzwvase.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // collections
        const productsCollections = client.db('supplyVista').collection('products');
        const categoriesCollections = client.db('supplyVista').collection('categories');

        // Porducts related api
        // post a product to database
        app.post('/products', async (req, res) => {
            const productData = req.body;
            const result = await productsCollections.insertOne(productData);
            res.send(result)

        })
        // get all products api
        app.get('/products', async (req, res) => {
            const category = req.query.category? decodeURIComponent(req.query.category) : null // get category
            // console.log("category", category)
            const query = category ? {
                category: category
            } : {}
            // console.log(query)
            const cursor = productsCollections.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        // get single product api
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollections.findOne(query);
            res.send(result);
        })
        // update data
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedProduct = req.body;
            const updatedDoc = {
                $set: updatedProduct
            }
            const result = await productsCollections.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        // categories related api
        app.get('/categories', async (req, res) => {
            const result = await categoriesCollections.find().toArray()
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// server checking code
app.get('/', (req, res) => {
    res.send("market server is working");
})
app.listen(port, () => {
    console.log(`server is running on ${port}`)
})