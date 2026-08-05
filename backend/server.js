const express=require("express");
const cors=require("cors");
const axios=require("axios");

const app=express();

app.use(cors());

app.get("/",async(req,res)=>{

try{

const ip=req.headers["x-forwarded-for"]?.split(",")[0]||req.socket.remoteAddress;

const response=await axios.get(`https://ipwho.is/${ip}`);

console.log(`[${new Date().toLocaleString()}] ${response.data.country} ${response.data.ip}`);

res.json(response.data);

}catch(e){

console.log(e.message);

res.status(500).json({
success:false,
error:e.message
});

}

});

const port=process.env.PORT||3000;

app.listen(port);