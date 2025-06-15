const express =require('express');
const app=express();
const cors= require('cors');
const dbConnect = require('./config/db');
const QRCode =require('qrcode');
const path = require('path');
const fs=require('fs');
const { connection } = require('mongoose');
require('dotenv').config();
const user=require('./models/user');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const qs = require('qs'); // Import the qs library for query string serialization

cloudinary.config({
  cloud_name: 'dvm9yapki',
  api_key: '435241843987915',
  api_secret: 'RC506MY4qn6DV5shRvYOmvBXIOc'
});




app.use(cors());
app.use(express.json());
app.get('/',(req,res)=>{
    res.send("Welcome to the Gita Session Registration API");
})
app.use('/qrcodes', express.static(path.join(__dirname, 'qrcodes')));
dbConnect();
connection.on('success',()=>{
    console.log("Database connected successfully");
})
app.post('/register', async (req, res) => {
  const {
    name,
    whatsappNumber,
    age,
    collegeOrWorking,
    place,
    selectedBook,
    interestedInGitaSession
  } = req.body;

  if (!name || !whatsappNumber || !age || !collegeOrWorking || !place || selectedBook === undefined || interestedInGitaSession === undefined) {
    return res.status(400).json({ message: "All fields are required" });
  }
  let phone="91"+whatsappNumber;
  try {
    const userId = uuidv4();

    const qrContent = `https://qr-production-7500.up.railway.app/verify/${userId}`;
    const qrFolder = path.join(__dirname, 'qrcodes');
    const qrPath = path.join(qrFolder, `${userId}.png`);

    fs.mkdirSync(qrFolder, { recursive: true });

    await QRCode.toFile(qrPath, qrContent);

    // Upload the QR code PNG file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(qrPath, {
      folder: 'qrcodes',  // optional folder in Cloudinary
      public_id: userId,  // use userId as the file name
      overwrite: true,
      resource_type: 'image'
    });

    // Delete local file after upload to keep server clean
    fs.unlinkSync(qrPath);

    // Save user with the Cloudinary URL
    const newUser = new user({
      name,
      whatsappNumber:phone,
      age,
      collegeOrWorking,
      place,
      selectedBook,
      interestedInGitaSession,
      userId,
      qrUrl: uploadResult.secure_url,  // store the Cloudinary URL here
      verified: false
    });

    await newUser.save();
    // import axios from 'axios';
// import qs from 'qs'; // Import the qs library

const API_KEY = 'zbut4tsg1ouor2jks4umy1d92salxm38';
const DESTINATION_PHONE_NUMBER = '917075176108'; // Replace with the real phone number

const axios = require('axios');
const qs = require('qs'); // For URL-encoded data

const data = qs.stringify({
  channel: 'whatsapp',
  source: '917075176108', 
  destination: `${whatsappNumber}`,
  'src.name': '4KoeJVChI420QyWVhAW1kE7L',
  template: JSON.stringify({
    id: '43aa4337-ea38-44f8-b199-2515326360a2',
    params: ['siva']
  }),
  message: JSON.stringify({
    image: {
      link: 'https://fss.gupshup.io/0/public/0/0/gupshup/917075176108/4bb165ae-db4f-447b-99c5-aa064349dec7/1749050853458_download%2520%25281%2529.png'
    },
    type: 'image'
  })
});

const config = {
  method: 'post',
  url: 'https://api.gupshup.io/wa/api/v1/template/msg',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'apikey': 'zbut4tsg1ouor2jks4umy1d92salxm38',
    'Cache-Control': 'no-cache'
  },
  data
};

axios(config)
  .then(response => {
    console.log('Success:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response ? error.response.data : error.message);
  });


    return res.status(200).json({
      message: "Registration successful",
      qrUrl: uploadResult.secure_url,
    });

  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});



app.get('/verify/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user1 = await user.findOne({ userId });
    if (!user1) {
      return res.status(404).send("❌ Invalid QR code or user not found.");
    }

    if (user1.verified) {
      return res.send(`⚠️ ${user1.name} already checked in on ${user1.verifiedAt.toLocaleString()}`);
    }

    user1.verified = true;
    user1.verifiedAt = new Date();
    await user1.save();

 res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification</title>
    <style>
      body {
        font-family: sans-serif;
        text-align: center;
        padding: 3rem;
        background-color: #f9f9f9;
      }
      .box {
        max-width: 400px;
        margin: auto;
        padding: 2rem;
        border-radius: 12px;
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      .success {
        color: green;
        font-size: 1.5rem;
      }
      .warning {
        color: orange;
        font-size: 1.3rem;
      }
      .error {
        color: red;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <h1 class="success">✅ Welcome ${user1.name}!</h1>
      <p>Your attendance has been recorded on:</p>
      <p><strong>${user1.verifiedAt.toLocaleString()}</strong></p>
    </div>
  </body>
  </html>
`);

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).send("Internal server error during verification.");
  }
});

app.get('/attendance/count', async (req, res) => {
  try {
    const totalRegistered = await user.countDocuments();
    const totalAttended = await user.countDocuments({ verified: true });
    const notAttended = totalRegistered - totalAttended;

    res.json({
      totalRegistered,
      totalAttended,
      notAttended
    });
  } catch (error) {
    console.error("Error fetching attendance count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.listen(3001,()=>{
    console.log("Server is running on port 3000")
})