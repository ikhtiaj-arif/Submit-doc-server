const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')

const app = express()
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('Server is running...')
})


// verify user with JWT
function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized Access!')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(401).send('Unauthorized Access!')
        }
        req.decoded = decoded;
        next()
    })
}


const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function run() {
    try{
        const usersCollection = client.db('projects').collection('user1')
        const documentsCollection = client.db('projects').collection('documents1')

        // set or update user to database  
        app.put('/users/:email', async(req, res)=>{
            const user = req.body;
            const email = req.params.email;
            const filter = { email: email };
            const option = { upsert: true};
            const updatedDoc = {
                $set: user 
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, option);

            const token = jwt.sign(user, process.env.TOKEN_SECRET, {expiresIn: '1d'});

            res.send({user, token})
        })

 // get all users
        app.get('/users', verifyJWT, async(req, res)=> {
            const query = {};
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })
// get user by email
        app.get('/user',verifyJWT, async(req, res) => {
            const email = req.query.email;
            const query = { email: email};
            const user = await usersCollection.findOne(query);
            res.send(user)
        })


// post documents to db
        app.post('/documents', verifyJWT, async(req, res)=>{
            const document = req.body;
            console.log(req.body);
            const result = await documentsCollection.insertOne(document);
            res.send(result)
        })
// get all documents
        app.get('/documents', verifyJWT, async(req, res)=> {
            const query = {};
            const result = await documentsCollection.find(query).toArray();
            res.send(result)
        })

        // get documents by user email
        app.get('/documents', verifyJWT,  async(req, res)=> {
            const email = req.query.email;
            const query = {email: email};
            const result = await documentsCollection.find(query).toArray();
            res.send(result)
        })


    }
    finally{

    }
}
run()



  
  
app.listen(port, () => {
    console.log(`Server is running...on ${port}`)
  })
  