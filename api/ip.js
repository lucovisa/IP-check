const axios=require("axios");

module.exports=async(req,res)=>{

res.setHeader("Access-Control-Allow-Origin","*");
res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
res.setHeader("Access-Control-Allow-Headers","Content-Type");

if(req.method==="OPTIONS"){
return res.status(200).end();
}

try{

const ip=req.headers["x-forwarded-for"]?.split(",")[0]||req.socket.remoteAddress;

console.log(`[${new Date().toLocaleString()}] IP: ${ip}`);

const response=await axios.get(`https://ipwho.is/${ip}`,{
timeout:5000
});

console.log(`${response.data.country} ${response.data.ip}`);

res.status(200).json(response.data);

}catch(e){

console.log("ERROR:",e.message);

res.status(500).json({
success:false,
error:e.message
});

}

};
