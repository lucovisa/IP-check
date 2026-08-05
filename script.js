const button=document.getElementById("check");
const result=document.getElementById("result");

button.onclick=async()=>{

result.innerHTML="Загрузка...";

try{

const response=await fetch("https://ip-check-lh5l.onrender.com/");
const data=await response.json();

result.innerHTML=`
<h2>${data.ip}</h2>

<b>Страна</b><br>
${data.country}<br><br>

<b>Город</b><br>
${data.city}<br><br>

<b>Регион</b><br>
${data.region}<br><br>

<b>Провайдер</b><br>
${data.connection.isp}<br><br>

<b>Организация</b><br>
${data.connection.org}<br><br>

<b>ASN</b><br>
${data.connection.asn}<br><br>

<b>Часовой пояс</b><br>
${data.timezone.id}<br><br>

<b>Координаты</b><br>
${data.latitude}, ${data.longitude}
`;

}catch{

result.innerHTML="Ошибка подключения к серверу.";

}

};