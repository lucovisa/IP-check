const express=require("express");
const cors=require("cors");
const axios=require("axios");

const app=express();

app.use(cors());

app.get("/",(req,res)=>{
res.json({
status:"online"
});
});

app.get("/ip/:ip",async(req,res)=>{

const ip=req.params.ip;

try{

const response=await axios.get(`https://ipwho.is/${ip}`);

const data=response.data;

console.log(`[${new Date().toLocaleString()}] ${data.country} ${data.ip}`);

res.json(data);

}catch{

res.status(500).json({
success:false
});

}

});

const port=process.env.PORT||3000;

app.listen(port);