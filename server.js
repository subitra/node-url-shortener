const express = require('express');
const { MongoClient } = require('mongodb');
const { nanoid } = require('nanoid');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5050;

app.use(express.json());

const getMongoClient = (async function () {
  let mongoClient;
  const connectToMongo = async () => {
    if (mongoClient) return mongoClient;
    const connectionString = process.env.MONGO_URL;
    mongoClient = new MongoClient(connectionString);
    try {
      await mongoClient.connect(connectionString);
      return mongoClient;
    } catch (error) {
      throw error;
    }
  };
  if (!mongoClient) mongoClient = await connectToMongo();
  return mongoClient;
})();

async function getCollection() {
  const client = await getMongoClient;
  try {
    const collection = client
      .db(process.env.DB_NAME)
      .collection(process.env.COLLECTION_NAME);
    return collection;
  } catch (error) {
    throw error;
  }
}

app.get('/api/health', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    isMongoUp: false,
  }
  try {   
    const client = await getMongoClient;
    const pingResult = await client.db(process.env.DB_NAME).command({ ping: 1 });  
    if(pingResult.ok === 1) {
      healthCheck.message = 'OK';
      healthCheck.isMongoUp = true;
    }
    return res.send(healthCheck);
  } catch (e) {
    healthCheck.message = e.message || 'Health check failed!';
    return res.status(503).send(healthCheck);
  }
});

app.post('/api/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl)
    return res.status(404).json({ message: ' No request body found!' });
  try {
    const obj = {
      originalUrl,
      shortId: nanoid(12),
      created: moment.utc(new Date()).toISOString(),
    };
    const model = await getCollection();
    await model.insertOne(obj);
    const shortenedUrl = {
      shortUrl: `${process.env.DOMAIN}/${obj.shortId}`,
    };
    return res.send(shortenedUrl);
  } catch (error) {
     res.status(500).json({message: error.message, stackTrace: error.stack});
  }
});

app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  if (!shortId) return res.status(404).json({ message: 'Parameters missing!' });
  try {
    const model = await getCollection();
    const urlInstance = await model.findOneAndDelete({ shortId });
    if (!urlInstance || !urlInstance.originalUrl)
      return res.status(404).json({
        message: `No instance record matching shortId-${shortId} fetched`,
      });
    res.redirect(urlInstance.originalUrl);
  } catch (error) {
    res.status(500).json({message: error.message, stackTrace: error.stack});
  }
});

const server = app.listen(PORT, () => {
  console.log('Server listening at port', PORT);
});

const closeServer = async (eventName) => {
  console.log(`closing server: ${eventName}`);
  server.close(async () => {
    const client = await getMongoClient;
    client.close();
  });
};

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
