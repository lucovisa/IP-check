const express=require("express");
const cors=require("cors");
const axios=require("axios");

const app=express();

app.use(cors());

app.get("/",async(req,res)=>{

const ip=req.headers["x-forwarded-for"]?.split(",")[0]||req.socket.remoteAddress;

console.log("Посетитель:",ip);

try{

const response=await axios.get(`https://ipwho.is/${ip}`,{
timeout:5000
});

console.log(
`[${new Date().toLocaleString()}] ${response.data.country} ${response.data.ip}`
);

res.json(response.data);

}catch(e){

console.log("Ошибка API:",e.message);

res.status(500).json({
success:false,
error:e.message
});

}

});

const port=process.env.PORT||3000;

app.listen(port,()=>{
console.log("Server started on",port);
});