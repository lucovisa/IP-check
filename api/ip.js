const axios=require("axios");

module.exports=async(req,res)=>{

try{

const ip=req.headers["x-forwarded-for"]?.split(",")[0]||req.socket.remoteAddress;

console.log(`[${new Date().toLocaleString()}] IP: ${ip}`);

const response=await axios.get(`https://ipwho.is/${ip}`);

const data=response.data;

console.log(`${data.country} ${data.ip}`);

res.status(200).json(data);

}catch(e){

console.log("ERROR:",e.message);

res.status(500).json({
success:false,
error:e.message
});

}

};