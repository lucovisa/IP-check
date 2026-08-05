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

const CDN_FILES = [
  "https://speed.cloudflare.com/__down?bytes=10000000",
  "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js",
  "https://code.jquery.com/jquery-3.7.1.min.js",
  "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
];

function getOverallQuality(ping, download) {
  if (ping < 30 && download >= 50) return { text: "Отлично", color: "#00b894", video: "4K" };
  if (ping < 80 && download >= 25) return { text: "Хорошо", color: "#0984e3", video: "1440p" };
  if (ping < 150 && download >= 10) return { text: "Средне", color: "#fdcb6e", video: "1080p" };
  if (download >= 5) return { text: "Средне", color: "#fdcb6e", video: "720p" };
  return { text: "Плохо", color: "#d63031", video: "360p" };
}

speedStart.onclick = async () => {
  speedStart.disabled = true;

  speedResult.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:15px;margin-bottom:12px;color:#888;">Измерение загрузки...</div>
      <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
        <div id="progress" style="width:0%;height:100%;background:#00b894;border-radius:2px;transition:width 0.1s;"></div>
      </div>
      <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
    </div>
  `;

  try {
    const downloadResult = await measureDownload(15, document.getElementById("progress"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#00b894;margin-bottom:15px;">Загрузка: ${downloadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:15px;margin-bottom:8px;color:#888;">Измерение задержки...</div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#fdcb6e;border-radius:2px;transition:width 0.3s;"></div>
        </div>
      </div>
    `;

    const ping = await measurePing(document.getElementById("progress"));

    await new Promise(r => setTimeout(r, 400));

    const overall = getOverallQuality(ping, downloadResult);

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

async function measurePing(progressBar) {
  const pings = [];

  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await fetch("https://speed.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    const end = performance.now();
    pings.push(Math.round(end - start));

    progressBar.style.width = ((i + 1) / 10) * 100 + "%";

    if (i < 9) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  pings.sort((a, b) => a - b);
  return pings[Math.floor(pings.length / 2)];
}

async function measureDownload(durationSec, progressBar, speedText) {
  const startTime = performance.now();
  let totalBytes = 0;

  async function downloadFromCDN(url) {
    while (performance.now() - startTime < durationSec * 1000) {
      try {
        const response = await fetch(url + "&r=" + Math.random(), { cache: "no-store" });
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.length;
          const elapsed = (performance.now() - startTime) / 1000;
          if (elapsed >= durationSec) break;
        }
      } catch {
        continue;
      }
    }
  }

  const workers = CDN_FILES.map(url => downloadFromCDN(url));

  const updateInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const percent = Math.min((elapsed / durationSec) * 100, 100);
    progressBar.style.width = percent + "%";
    const totalMB = totalBytes / 1000000;
    const speed = (totalMB / Math.max(elapsed, 0.1)) * 8;
    speedText.textContent = speed.toFixed(1) + " Мбит/с";
  }, 200);

  await Promise.race([
    Promise.all(workers),
    new Promise(r => setTimeout(r, durationSec * 1000))
  ]);

  clearInterval(updateInterval);

  const totalTime = (performance.now() - startTime) / 1000;
  const totalMB = totalBytes / 1000000;
  return (totalMB / totalTime) * 8;
}
