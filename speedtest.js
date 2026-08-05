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

function getOverallQuality(ping, download, upload) {
  const avgSpeed = (download + upload) / 2;

  if (ping < 30 && avgSpeed >= 50) return { text: "Отлично", color: "#00b894", video: "4K" };
  if (ping < 80 && avgSpeed >= 25) return { text: "Хорошо", color: "#0984e3", video: "1440p" };
  if (ping < 150 && avgSpeed >= 10) return { text: "Средне", color: "#fdcb6e", video: "1080p" };
  if (avgSpeed >= 5) return { text: "Средне", color: "#fdcb6e", video: "720p" };
  return { text: "Плохо", color: "#d63031", video: "360p" };
}

speedStart.onclick = async () => {
  speedStart.disabled = true;

  speedResult.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:15px;margin-bottom:12px;color:#888;">Измерение загрузки...</div>
      <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
        <div id="progress" style="width:0%;height:100%;background:#00b894;border-radius:2px;transition:width 0.08s;"></div>
      </div>
      <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
    </div>
  `;

  try {
    const downloadResult = await measureDownload(5, 10, 30, document.getElementById("progress"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#00b894;margin-bottom:15px;">Загрузка: ${downloadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:15px;margin-bottom:8px;color:#888;">Измерение отдачи...</div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#0984e3;border-radius:2px;transition:width 0.08s;"></div>
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
      </div>
    `;

    const uploadResult = await measureUpload(3, 8, 20, document.getElementById("progress"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#00b894;margin-bottom:4px;">Загрузка: ${downloadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:20px;font-weight:700;color:#0984e3;margin-bottom:15px;">Отдача: ${uploadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:15px;margin-bottom:8px;color:#888;">Измерение задержки...</div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#fdcb6e;border-radius:2px;transition:width 0.3s;"></div>
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;" id="pingValue">...</div>
      </div>
    `;

    const ping = await measurePing(document.getElementById("progress"), document.getElementById("pingValue"));

    await new Promise(r => setTimeout(r, 600));

    const overall = getOverallQuality(ping, downloadResult, uploadResult);

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:40px;font-weight:700;color:${overall.color};margin-bottom:8px;">${overall.text}</div>
        <div style="font-size:16px;color:#888;margin-bottom:20px;">Можно смотреть видео в ${overall.video}</div>
        <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;">
          <div>
            <div style="font-size:11px;color:#555;">Загрузка</div>
            <div style="font-size:18px;font-weight:700;color:#00b894;">${downloadResult.toFixed(1)}<span style="font-size:11px;"> Мбит/с</span></div>
          </div>
          <div>
            <div style="font-size:11px;color:#555;">Отдача</div>
            <div style="font-size:18px;font-weight:700;color:#0984e3;">${uploadResult.toFixed(1)}<span style="font-size:11px;"> Мбит/с</span></div>
          </div>
          <div>
            <div style="font-size:11px;color:#555;">Задержка</div>
            <div style="font-size:18px;font-weight:700;color:#fdcb6e;">${ping}<span style="font-size:11px;"> мс</span></div>
          </div>
        </div>
      </div>
    `;
  } catch {
    speedResult.innerHTML = `
      <div style="text-align:center;font-size:16px;color:#d63031;">Ошибка теста</div>
      <div style="text-align:center;font-size:14px;color:#888;margin-top:8px;">Проверьте подключение</div>
    `;
  } finally {
    speedStart.disabled = false;
  }
};

async function measurePing(progressBar, pingText) {
  const targets = [
    "https://speed.cloudflare.com/cdn-cgi/trace",
    "https://www.google.com/favicon.ico",
    "https://www.cloudflare.com/favicon.ico",
    "https://1.1.1.1/favicon.ico"
  ];

  let bestPing = Infinity;

  for (const target of targets) {
    const pings = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      try {
        await fetch(target, { cache: "no-store", mode: "no-cors" });
        const end = performance.now();
        pings.push(Math.round(end - start));
      } catch {
        continue;
      }
    }
    if (pings.length > 0) {
      pings.sort((a, b) => a - b);
      const median = pings[Math.floor(pings.length / 2)];
      if (median < bestPing) {
        bestPing = median;
      }
    }

    const idx = targets.indexOf(target);
    progressBar.style.width = ((idx + 1) / targets.length) * 100 + "%";
    pingText.textContent = bestPing + " мс";

    if (idx < targets.length - 1) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  return bestPing;
}

async function measureDownload(warmupSec, waitSec, maxSec, progressBar, speedText) {
  const startTime = performance.now();
  let totalBytes = 0;
  let peakSpeed = 0;
  let peakTime = startTime;
  let testEnded = false;

  async function downloadStream() {
    while (!testEnded) {
      const file = `https://speed.cloudflare.com/__down?bytes=10000000&r=${Math.random()}`;
      try {
        const response = await fetch(file, { cache: "no-store" });
        const reader = response.body.getReader();
        while (!testEnded) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.length;
        }
      } catch {
        continue;
      }
    }
  }

  const workers = [];
  for (let i = 0; i < 8; i++) {
    workers.push(downloadStream());
  }

  const updateInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const totalMB = totalBytes / 1000000;
    const currentSpeed = (totalMB / Math.max(elapsed, 0.1)) * 8;

    progressBar.style.width = Math.min((elapsed / maxSec) * 100, 100) + "%";
    speedText.textContent = currentSpeed.toFixed(1) + " Мбит/с";

    if (elapsed > warmupSec) {
      if (currentSpeed > peakSpeed) {
        peakSpeed = currentSpeed;
        peakTime = performance.now();
      }
    }

    if (peakSpeed > 0 && elapsed > warmupSec) {
      const timeSincePeak = (performance.now() - peakTime) / 1000;
      if (timeSincePeak > waitSec && currentSpeed < peakSpeed) {
        testEnded = true;
      }
    }

    if (elapsed >= maxSec) {
      testEnded = true;
    }
  }, 200);

  await Promise.race([
    Promise.all(workers),
    new Promise(r => setTimeout(r, maxSec * 1000))
  ]);

  testEnded = true;
  clearInterval(updateInterval);

  const totalTime = (performance.now() - startTime) / 1000;
  const totalMB = totalBytes / 1000000;
  return (totalMB / totalTime) * 8;
}

async function measureUpload(warmupSec, waitSec, maxSec, progressBar, speedText) {
  const startTime = performance.now();
  let totalBytes = 0;
  let peakSpeed = 0;
  let peakTime = startTime;
  let testEnded = false;

  async function uploadStream() {
    while (!testEnded) {
      const data = new Uint8Array(1000000);
      for (let i = 0; i < 1000000; i++) {
        data[i] = Math.floor(Math.random() * 256);
      }

      try {
        await fetch("https://speed.cloudflare.com/__up", {
          method: "POST",
          cache: "no-store",
          body: data
        });
        totalBytes += 1000000;
      } catch {
        continue;
      }
    }
  }

  const workers = [];
  for (let i = 0; i < 4; i++) {
    workers.push(uploadStream());
  }

  const updateInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const totalMB = totalBytes / 1000000;
    const currentSpeed = (totalMB / Math.max(elapsed, 0.1)) * 8;

    progressBar.style.width = Math.min((elapsed / maxSec) * 100, 100) + "%";
    speedText.textContent = currentSpeed.toFixed(1) + " Мбит/с";

    if (elapsed > warmupSec) {
      if (currentSpeed > peakSpeed) {
        peakSpeed = currentSpeed;
        peakTime = performance.now();
      }
    }

    if (peakSpeed > 0 && elapsed > warmupSec) {
      const timeSincePeak = (performance.now() - peakTime) / 1000;
      if (timeSincePeak > waitSec && currentSpeed < peakSpeed) {
        testEnded = true;
      }
    }

    if (elapsed >= maxSec) {
      testEnded = true;
    }
  }, 200);

  await Promise.race([
    Promise.all(workers),
    new Promise(r => setTimeout(r, maxSec * 1000))
  ]);

  testEnded = true;
  clearInterval(updateInterval);

  const totalTime = (performance.now() - startTime) / 1000;
  const totalMB = totalBytes / 1000000;
  return (totalMB / totalTime) * 8;
}
