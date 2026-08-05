(function () {
  const banUntil = localStorage.getItem("banUntil");
  if (banUntil && Date.now() < parseInt(banUntil)) {
    if (!window.location.href.includes("ban.html")) {
      window.location.href = "ban.html";
    }
  }
})();

const speedStart = document.getElementById("speedStart");
const speedResult = document.getElementById("speedResult");

let downloadValues = [];

function drawGauge(canvas, value, max, color, label) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(centerX, centerY) - 8;

  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
  ctx.strokeStyle = "#1b1b1b";
  ctx.lineWidth = 8;
  ctx.stroke();

  const angle = 0.75 * Math.PI + (Math.min(value, max) / max) * 1.5 * Math.PI;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, centerX, centerY - 8);

  ctx.font = "bold 22px Arial";
  ctx.fillText(value.toFixed(1), centerX, centerY + 20);

  ctx.font = "10px Arial";
  ctx.fillText("Мбит/с", centerX, centerY + 36);
}

function drawChart(canvas, values, color) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (values.length < 2) return;

  const maxVal = Math.max(...values, 1);
  const stepX = w / (values.length - 1);

  ctx.beginPath();
  ctx.moveTo(0, h - (values[0] / maxVal) * h);

  for (let i = 1; i < values.length; i++) {
    ctx.lineTo(i * stepX, h - (values[i] / maxVal) * h);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.lineTo((values.length - 1) * stepX, h);
  ctx.lineTo(0, h);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, color + "40");
  gradient.addColorStop(1, color + "00");
  ctx.fillStyle = gradient;
  ctx.fill();
}

function getQuality(speed) {
  if (speed < 5) return { text: "Медленно", color: "#d63031" };
  if (speed < 25) return { text: "Средне", color: "#fdcb6e" };
  if (speed < 100) return { text: "Хорошо", color: "#00b894" };
  return { text: "Отлично", color: "#0984e3" };
}

speedStart.onclick = async () => {
  speedStart.disabled = true;

  speedResult.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:16px;margin-bottom:15px;">Подготовка...</div>
      <canvas id="gaugeDownload" width="120" height="120"></canvas>
      <canvas id="chartDownload" width="240" height="80" style="margin-top:10px;"></canvas>
    </div>
  `;

  const gaugeDownload = document.getElementById("gaugeDownload");
  const chartDownload = document.getElementById("chartDownload");

  downloadValues = [];

  drawGauge(gaugeDownload, 0, 100, "#888", "Загрузка");

  try {
    const pingStart = performance.now();
    await fetch("https://speed.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    const pingEnd = performance.now();
    const ping = Math.round(pingEnd - pingStart);

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:14px;margin-bottom:10px;">Пинг: <b>${ping} мс</b></div>
        <canvas id="gaugeDownload" width="120" height="120"></canvas>
        <canvas id="chartDownload" width="240" height="80" style="margin-top:10px;"></canvas>
      </div>
    `;

    const gaugeDownload2 = document.getElementById("gaugeDownload");
    const chartDownload2 = document.getElementById("chartDownload");

    const downloadResult = await measureDownload(downloadValues, gaugeDownload2, chartDownload2);

    const pingQuality = ping < 50 ? "#00b894" : ping < 150 ? "#fdcb6e" : "#d63031";
    const downloadQuality = getQuality(downloadResult);

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="display:flex;gap:15px;justify-content:center;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:11px;color:#888;">Пинг</div>
            <div style="font-size:22px;font-weight:700;color:${pingQuality};">${ping}<span style="font-size:12px;"> мс</span></div>
          </div>
          <div>
            <div style="font-size:11px;color:#888;">Загрузка</div>
            <div style="font-size:22px;font-weight:700;color:${downloadQuality.color};">${downloadResult.toFixed(1)}<span style="font-size:12px;"> Мбит/с</span></div>
            <div style="font-size:11px;color:${downloadQuality.color};">${downloadQuality.text}</div>
          </div>
        </div>
        <canvas id="finalChart" width="240" height="80"></canvas>
      </div>
    `;

    drawChart(document.getElementById("finalChart"), downloadValues, downloadQuality.color);
  } catch {
    speedResult.innerHTML = `
      <div style="text-align:center;font-size:16px;color:#d63031;">Ошибка теста</div>
      <div style="text-align:center;font-size:14px;color:#888;margin-top:8px;">Проверьте подключение</div>
    `;
  } finally {
    speedStart.disabled = false;
  }
};

async function measureDownload(values, gauge, chart) {
  const fileSizes = [1, 3, 5];
  let totalSpeed = 0;
  let count = 0;

  for (const size of fileSizes) {
    const file = `https://speed.cloudflare.com/__down?bytes=${size * 1000000}`;
    const start = performance.now();

    const response = await fetch(file, { cache: "no-store" });
    await response.arrayBuffer();

    const end = performance.now();
    const seconds = (end - start) / 1000;
    const speed = (size / seconds) * 8;

    totalSpeed += speed;
    count++;
    values.push(speed);

    drawGauge(gauge, totalSpeed / count, 200, "#00b894", "Загрузка");
    drawChart(chart, values, "#00b894");

    if (count < fileSizes.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return totalSpeed / count;
}