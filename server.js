require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose')

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Sucessfully Connected to MongoDB"))
    .catch((error) => console.error('MongoDB isnt connecting', error))


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log("Backend Server Running on Port")
    console.log(`hello  ${PORT}`)
});