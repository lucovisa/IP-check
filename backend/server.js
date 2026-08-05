const express=require("express");
const cors=require("cors");
const axios=require("axios");

const app=express();

app.use(cors());

app.get("/",async(req,res)=>{

let ip=req.headers["x-forwarded-for"]||req.socket.remoteAddress;

if(ip.includes(",")){
ip=ip.split(",")[0].trim();
}

if(ip.startsWith("::ffff:")){
ip=ip.replace("::ffff:","");
}

try{

const response=await axios.get(`https://ipwho.is/${ip}`);

const data=response.data;

const now=new Date().toLocaleString("ru-RU",{
timeZone:"UTC"
});

console.log(`[${now}] ${data.country} ${ip}`);

res.json(data);

}catch{

res.status(500).json({
success:false
});

}

});

const port=process.env.PORT||3000;

app.listen(port);