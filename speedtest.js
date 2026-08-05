const speedStart=document.getElementById("speedStart");
const speedResult=document.getElementById("speedResult");

speedStart.onclick=async()=>{

speedResult.innerHTML="Тестирование...";

const file="https://speed.cloudflare.com/__down?bytes=10000000";

const start=performance.now();

try{

await fetch(file,{
cache:"no-store"
});

const end=performance.now();

const seconds=(end-start)/1000;

const mb=10;

const speed=(mb/seconds)*8;

speedResult.innerHTML=
`Скорость загрузки:<br>${speed.toFixed(2)} Mbps`;

}catch{

speedResult.innerHTML="Ошибка теста";

}

};