const button=document.getElementById("check");
const result=document.getElementById("result");

button.onclick=async()=>{

result.innerHTML="Загрузка...";

const response=await fetch("https://ipapi.co/json/");
const data=await response.json();

result.innerHTML=`
IP: ${data.ip}<br>
Страна: ${data.country_name}<br>
Город: ${data.city}<br>
Регион: ${data.region}<br>
Провайдер: ${data.org}<br>
Часовой пояс: ${data.timezone}
`;

};