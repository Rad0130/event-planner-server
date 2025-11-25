const express=require('express');
const cors=require('cors');
require('dotenv').config();
const app=express();
const port= process.env.port || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dm5zycv.mongodb.net/?appName=Cluster0`;

//middleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db=client.db('SRevent');
    const collections=db.collection('events');

    app.get('/events', async(req,res)=>{
            const cursor=collections.find();
            const result=await cursor.toArray();
            res.send(result);
        });

        app.post('/events', async(req,res)=>{
            const newMovie=req.body;
            const result= await collections.insertOne(newMovie);
            res.send(result);
        });

        app.patch('/events/:id', async(req,res)=>{
            const id=req.params.id;
            const updatedevent=req.body;
            const query={_id: new ObjectId(id)};
            const update={
                $set:{
                    EventName:updatedevent.EventName,
                    Genre:updatedevent.Genre,
                    Price:updatedevent.Price
                }
            }
            const result=await collections.updateOne(query,update);
            res.send(result)
        })

        app.delete('/events/:id', async(req,res)=>{
            const id=req.params.id;
            const query={_id: new ObjectId(id)};
            const result=await collections.deleteOne(query);
            res.send(result);
        });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`event-planner listening on port ${port}`)
})