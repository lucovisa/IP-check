const check=document.getElementById("check");
const checkIp=document.getElementById("checkIp");
const ipInput=document.getElementById("ipInput");
const result=document.getElementById("result");
const copyAll=document.getElementById("copyAll");

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
${field("Провайдер",data.connection.isp)}
${field("Организация",data.connection.org)}
${field("ASN",data.connection.asn)}
${field("Часовой пояс",data.timezone.id)}
${field("Координаты",`${data.latitude}, ${data.longitude}`)}

<button onclick="mapOpen(${data.latitude},${data.longitude})">
Открыть на карте
</button>
`;

copyAll.style.display="block";

}catch{

result.innerHTML="Ошибка подключения";

}

}


function field(name,value){

return `
<div class="info">
<b>${name}</b>
<span>${value}</span>
<button onclick="copyText('${value}')">
Копировать
</button>
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