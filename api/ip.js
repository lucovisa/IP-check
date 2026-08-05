const button=document.getElementById("check");
const result=document.getElementById("result");

button.onclick=async()=>{

result.innerHTML="Загрузка...";

try{

const response=await fetch("https://ip-check-livid.vercel.app/api/ip");
const data=await response.json();

result.innerHTML=`
<h2>${data.ip}</h2>

<b>Страна:</b> ${data.country} ${data.flag.emoji}<br>
<b>Регион:</b> ${data.region}<br>
<b>Город:</b> ${data.city}<br>
<b>Провайдер:</b> ${data.connection.isp}<br>
<b>Организация:</b> ${data.connection.org}<br>
<b>ASN:</b> ${data.connection.asn}<br>
<b>Часовой пояс:</b> ${data.timezone.id}<br>
<b>Координаты:</b> ${data.latitude}, ${data.longitude}
`;

}catch{

result.innerHTML="Ошибка подключения.";

}

};