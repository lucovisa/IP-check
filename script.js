const check=document.getElementById("check");
const checkIp=document.getElementById("checkIp");
const ipInput=document.getElementById("ipInput");
const result=document.getElementById("result");
const copyAll=document.getElementById("copyAll");
const downloadTxt=document.getElementById("downloadTxt");
const historyBox=document.getElementById("history");
const clearHistory=document.getElementById("clearHistory");

let currentData="";

async function loadIP(ip=""){

result.innerHTML="Загрузка...";

try{

let url="https://ip-check-livid.vercel.app/api/ip";

if(ip){
url+=`?ip=${ip}`;
}

const response=await fetch(url);
const data=await response.json();
if(data.banned){

localStorage.setItem(
"banUntil",
Date.now()+data.remaining*1000
);

window.location.href="ban.html";

return;

}
saveHistory(data);

currentData=`
IP: ${data.ip}
Страна: ${data.country}
Регион: ${data.region}
Город: ${data.city}
Провайдер: ${data.connection.isp}
Организация: ${data.connection.org}
ASN: ${data.connection.asn}
Часовой пояс: ${data.timezone.id}
Координаты: ${data.latitude}, ${data.longitude}
`;

result.innerHTML=`
${field("IP",data.ip)}
${field("Страна",data.country+" "+data.flag.emoji)}
${field("Регион",data.region)}
${field("Город",data.city)}
${field(
"Провайдер",
data.providerSite
? `<a href="${data.providerSite}" target="_blank">${data.connection.isp}</a>`
: data.connection.isp
)}
${field("Организация",data.connection.org)}
${field("ASN",data.connection.asn)}
${field("Часовой пояс",data.timezone.id)}
${field("Координаты",`${data.latitude}, ${data.longitude}`)}
${field("Браузер",data.device.browser)}
${field("ОС",data.device.os)}
${field("Версия браузера",data.device.browserVersion)}
${field("Язык",data.device.language)}
${field("User-Agent",data.device.userAgent)}
${field("DNS",data.dns.hostname)}

<button onclick="mapOpen(${data.latitude},${data.longitude})">
Открыть на карте
</button>
`;

copyAll.style.display="block";
downloadTxt.style.display="block";

}catch{

result.innerHTML="Ошибка подключения";

}

}


function field(name,value){

return `
<div class="info">
<b>${name}</b>
<span>${value}</span>
</div>
`;

}


function copyText(text){

navigator.clipboard.writeText(text);

}


function mapOpen(lat,lon){

window.open(
`https://www.google.com/maps?q=${lat},${lon}`,
"_blank"
);

}


copyAll.onclick=()=>{

navigator.clipboard.writeText(currentData);

};


check.onclick=()=>loadIP();

checkIp.onclick=()=>{

const ip=ipInput.value.trim();

if(ip){
loadIP(ip);
}

};

downloadTxt.onclick=()=>{

const blob=new Blob([currentData],{
type:"text/plain;charset=utf-8"
});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);
link.download="ip-report.txt";

link.click();

URL.revokeObjectURL(link.href);

};

function saveHistory(data){

let history=JSON.parse(localStorage.getItem("ipHistory"))||[];

history.unshift({
ip:data.ip,
country:data.country,
city:data.city,
date:new Date().toLocaleString()
});

if(history.length>10){
history=history.slice(0,10);
}

localStorage.setItem(
"ipHistory",
JSON.stringify(history)
);

showHistory();

}


function showHistory(){

let history=JSON.parse(localStorage.getItem("ipHistory"))||[];

historyBox.innerHTML="";

if(history.length===0){

historyBox.innerHTML="История пуста";
return;

}

history.forEach(item=>{

historyBox.innerHTML+=`

<div class="history-item">

<b>${item.ip}</b><br>

${item.country}<br>

${item.city||""}<br>

<small>${item.date}</small>

</div>

`;

});

}


clearHistory.onclick=()=>{

localStorage.removeItem("ipHistory");

showHistory();

};


showHistory();