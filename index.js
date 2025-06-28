require('dotenv').config()
const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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
        // await client.connect();

        // collections
        const productsCollections = client.db('supplyVista').collection('products');
        const categoriesCollections = client.db('supplyVista').collection('categories');
        const ordersCollections = client.db('supplyVista').collection('orders')

        // Porducts related api
        // post a product to database
        app.post('/products', async (req, res) => {
            const productData = req.body;
            const result = await productsCollections.insertOne(productData);
            res.send(result)
        })
        // get all products api
        app.get('/products', async (req, res) => {
            const category = req.query.category ? decodeURIComponent(req.query.category) : null // get category
            const email = req.query?.email; //get email
             console.log('user',email)
             const filter = {}
            // const filter = {brand_email : email};    // match and filter
            if(email){
                filter.brand_email = email;
            }
            if(category){
                filter.category = category;
            }
            const cursor = productsCollections.find(filter);
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


        // Orders related api
        app.post('/orders', async(req,res)=>{
            const orderData = req.body;
            
            const result = await ordersCollections.insertOne(orderData);
            if(result.acknowledged){
                const {orderId, order_quantity} = orderData
                await productsCollections.updateOne({_id: new ObjectId(orderId)}, {
                    $inc:{
                        total: -order_quantity
                    }
                })
            }
            res.send(result)
            
        })

        app.get('/orders', async(req, res)=>{
            const email = req.query?.email;
            const filter = {customer_email : email};
            const result = await ordersCollections.find(filter).toArray();

            //aggregate data
            for (const order of result){
                const orderId = order.orderId;
                const orderQuery = {_id : new ObjectId(orderId)}
                const product = await productsCollections.findOne(orderQuery)
                order.productName = product.productName
                order.product_image = product.product_image
                order.category = product.category
                order.minimumSell = product.minimumSell
                order.description = product.description
                order.price = product.price
                order.rating = product.rating
                order.brand = product.brand
            }
            res.send(result)

        })
        // delete api to delete orders from database
        app.delete('/orders/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const order = await ordersCollections.findOne(query)
            const orderId = order.orderId;
            const order_quantity = order.order_quantity
            const result = await ordersCollections.deleteOne(query);
            
            // increase total stock after remove from cart
            if(result.acknowledged){
                await productsCollections.updateOne({_id: new ObjectId(orderId)}, {
                    $inc:{
                        total: order_quantity
                    }
                })
            }
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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