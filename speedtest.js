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
let uploadValues = [];

function drawGauge(canvas, value, max, color, label) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(centerX, centerY) - 10;

  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
  ctx.strokeStyle = "#1b1b1b";
  ctx.lineWidth = 10;
  ctx.stroke();

  const angle = 0.75 * Math.PI + (Math.min(value, max) / max) * 1.5 * Math.PI;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, centerX, centerY - 8);

  ctx.font = "bold 24px Arial";
  ctx.fillText(value.toFixed(1), centerX, centerY + 22);

  ctx.font = "12px Arial";
  ctx.fillText("Мбит/с", centerX, centerY + 42);
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
      <div style="font-size:18px;margin-bottom:20px;">Подготовка...</div>
      <div style="display:flex;gap:20px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
        <div>
          <div style="font-size:14px;color:#888;margin-bottom:5px;">Загрузка</div>
          <canvas id="gaugeDownload" width="140" height="140"></canvas>
          <canvas id="chartDownload" width="220" height="100" style="margin-top:8px;"></canvas>
        </div>
        <div>
          <div style="font-size:14px;color:#888;margin-bottom:5px;">Отдача</div>
          <canvas id="gaugeUpload" width="140" height="140"></canvas>
          <canvas id="chartUpload" width="220" height="100" style="margin-top:8px;"></canvas>
        </div>
      </div>
    </div>
  `;

  const gaugeDownload = document.getElementById("gaugeDownload");
  const gaugeUpload = document.getElementById("gaugeUpload");
  const chartDownload = document.getElementById("chartDownload");
  const chartUpload = document.getElementById("chartUpload");

  downloadValues = [];
  uploadValues = [];

  drawGauge(gaugeDownload, 0, 100, "#888", "Загрузка");
  drawGauge(gaugeUpload, 0, 100, "#888", "Отдача");

  try {
    const pingStart = performance.now();
    await fetch("https://speed.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    const pingEnd = performance.now();
    const ping = Math.round(pingEnd - pingStart);

    const downloadResult = await measureDownload(downloadValues, gaugeDownload, chartDownload);
    const uploadResult = await measureUpload(uploadValues, gaugeUpload, chartUpload);

    const pingQuality = ping < 50 ? "#00b894" : ping < 150 ? "#fdcb6e" : "#d63031";
    const downloadQuality = getQuality(downloadResult);
    const uploadQuality = getQuality(uploadResult);

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;">
          <div>
            <div style="font-size:12px;color:#888;margin-bottom:4px;">Пинг</div>
            <div style="font-size:28px;font-weight:700;color:${pingQuality};">${ping}<span style="font-size:14px;"> мс</span></div>
          </div>
          <div>
            <div style="font-size:12px;color:#888;margin-bottom:4px;">Загрузка</div>
            <div style="font-size:28px;font-weight:700;color:${downloadQuality.color};">${downloadResult.toFixed(1)}<span style="font-size:14px;"> Мбит/с</span></div>
            <div style="font-size:12px;color:${downloadQuality.color};">${downloadQuality.text}</div>
          </div>
          <div>
            <div style="font-size:12px;color:#888;margin-bottom:4px;">Отдача</div>
            <div style="font-size:28px;font-weight:700;color:${uploadQuality.color};">${uploadResult.toFixed(1)}<span style="font-size:14px;"> Мбит/с</span></div>
            <div style="font-size:12px;color:${uploadQuality.color};">${uploadQuality.text}</div>
          </div>
        </div>
        <canvas id="finalChart" width="400" height="160"></canvas>
      </div>
    `;

    drawFinalChart(
      document.getElementById("finalChart"),
      downloadValues,
      uploadValues,
      downloadQuality.color,
      uploadQuality.color
    );
  } catch {
    speedResult.innerHTML = `
      <div style="text-align:center;font-size:16px;color:#d63031;">Ошибка теста</div>
      <div style="text-align:center;font-size:14px;color:#888;margin-top:8px;">Проверьте подключение и попробуйте снова</div>
    `;
  } finally {
    speedStart.disabled = false;
  }
};

async function measureDownload(values, gauge, chart) {
  const fileSizes = [1, 5, 10];
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
      await new Promise(r => setTimeout(r, 400));
    }
  }

  return totalSpeed / count;
}

async function measureUpload(values, gauge, chart) {
  const sizes = [500000, 1000000, 2000000];
  let totalSpeed = 0;
  let count = 0;

  for (const size of sizes) {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }

    const start = performance.now();

    try {
      await fetch("https://speed.cloudflare.com/__up", {
        method: "POST",
        cache: "no-store",
        body: data
      });
    } catch {
      return 0;
    }

    const end = performance.now();
    const seconds = (end - start) / 1000;
    const mb = size / 1000000;
    const speed = (mb / seconds) * 8;

    totalSpeed += speed;
    count++;
    values.push(speed);

    drawGauge(gauge, totalSpeed / count, 200, "#0984e3", "Отдача");
    drawChart(chart, values, "#0984e3");

    if (count < sizes.length) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  return totalSpeed / count;
}

function drawFinalChart(canvas, download, upload, downloadColor, uploadColor) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const allValues = [...download, ...upload];
  const maxVal = Math.max(...allValues, 1);
  const totalPoints = Math.max(download.length, upload.length);
  const stepX = w / (totalPoints - 1 || 1);

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const y = (h / 3) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  if (download.length > 1) {
    ctx.beginPath();
    ctx.moveTo(0, h - (download[0] / maxVal) * h);
    for (let i = 1; i < download.length; i++) {
      ctx.lineTo(i * stepX, h - (download[i] / maxVal) * h);
    }
    ctx.strokeStyle = downloadColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  if (upload.length > 1) {
    ctx.beginPath();
    ctx.moveTo(0, h - (upload[0] / maxVal) * h);
    for (let i = 1; i < upload.length; i++) {
      ctx.lineTo(i * stepX, h - (upload[i] / maxVal) * h);
    }
    ctx.strokeStyle = uploadColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.fillStyle = "white";
  ctx.font = "10px Arial";
  ctx.textAlign = "right";
  ctx.fillText(maxVal.toFixed(0), w - 5, 14);
  ctx.fillText("0", w - 5, h - 5);

  ctx.fillStyle = downloadColor;
  ctx.textAlign = "left";
  ctx.fillRect(10, 10, 12, 3);
  ctx.fillText("Загрузка", 26, 14);

  ctx.fillStyle = uploadColor;
  ctx.fillRect(10, 22, 12, 3);
  ctx.fillText("Отдача", 26, 26);
}