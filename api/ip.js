const axios=require("axios");
const dns=require("dns").promises;
const requests=new Map();
const bans=new Map();

const REQUEST_LIMIT=30;
const REQUEST_WINDOW=10000;
const BAN_TIME=300000;

function getBrowser(ua){

let match;

if(ua.includes("Edg")){
match=ua.match(/Edg\/([\d.]+)/);
return {
name:"Microsoft Edge",
version:match?match[1]:"Неизвестно"
};
}

if(ua.includes("Chrome")){
match=ua.match(/Chrome\/([\d.]+)/);
return {
name:"Google Chrome",
version:match?match[1]:"Неизвестно"
};
}

if(ua.includes("Firefox")){
match=ua.match(/Firefox\/([\d.]+)/);
return {
name:"Mozilla Firefox",
version:match?match[1]:"Неизвестно"
};
}

if(ua.includes("Safari")){
match=ua.match(/Version\/([\d.]+)/);
return {
name:"Safari",
version:match?match[1]:"Неизвестно"
};
}

return {
name:"Неизвестно",
version:"Неизвестно"
};

}

function getOS(ua){

if(ua.includes("Windows")) return "Windows";
if(ua.includes("Android")) return "Android";
if(ua.includes("iPhone")||ua.includes("iPad")) return "iOS";
if(ua.includes("Mac")) return "macOS";
if(ua.includes("Linux")) return "Linux";

return "Неизвестная ОС";

}

module.exports=async(req,res)=>{

res.setHeader("Access-Control-Allow-Origin","*");
res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
res.setHeader("Access-Control-Allow-Headers","Content-Type");

if(req.method==="OPTIONS"){
return res.status(200).end();
}

try{

let ip=req.query.ip;

if(!ip){
ip=req.headers["x-forwarded-for"]?.split(",")[0]||req.socket.remoteAddress;
}

const now=Date.now();

if(bans.has(ip)){

const expires=bans.get(ip);

if(now<expires){

return res.status(429).json({
success:false,
banned:true,
remaining:Math.ceil((expires-now)/1000)
});

}

bans.delete(ip);

}

if(!requests.has(ip)){
requests.set(ip,[]);
}

const history=requests.get(ip);

while(history.length&&now-history[0]>REQUEST_WINDOW){
history.shift();
}

history.push(now);

if(history.length>=REQUEST_LIMIT){

bans.set(ip,now+BAN_TIME);

requests.delete(ip);

return res.status(429).json({
success:false,
banned:true,
remaining:300
});

}

const ua=req.headers["user-agent"]||"";

const browser=getBrowser(ua);
const os=getOS(ua);

console.log(`[${new Date().toLocaleString()}] ${ip} ${browser} ${os}`);

const response=await axios.get(`https://ipwho.is/${ip}`,{
timeout:5000
});

const data=response.data;
data.providerSite=data.connection.domain
? "https://" + data.connection.domain
: null;
let hostname="Нет данных";

try{

const result=await dns.reverse(ip);
hostname=result[0]||"Нет данных";

}catch{

hostname="Нет данных";

}

data.dns={
hostname
};

data.device={
browser:browser.name,
browserVersion:browser.version,
os,
language:req.headers["accept-language"]||"Неизвестно",
userAgent:ua
};

res.status(200).json(data);

}catch(e){

res.status(500).json({
success:false,
error:e.message
});

}

};