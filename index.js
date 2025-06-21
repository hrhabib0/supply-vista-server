const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;


// middleWar
app.use(cors());
app.use(express.json())


// server checking code
app.get('/', (req, res)=>{
    res.send("market server is working");
})
app.listen(port, ()=>{
    console.log(`server is running on ${port}`)
})