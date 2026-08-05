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

const SERVERS = [
  "wss://librespeed-azure.azurewebsites.net",
  "wss://librespeed.org",
  "wss://speedtest1-2.something.com"
];

function getOverallQuality(ping, download, upload) {
  const avgSpeed = (download + upload) / 2;

  if (ping < 30 && avgSpeed >= 50) return { text: "Отлично", color: "#00b894", video: "4K" };
  if (ping < 80 && avgSpeed >= 25) return { text: "Хорошо", color: "#0984e3", video: "1440p" };
  if (ping < 150 && avgSpeed >= 10) return { text: "Средне", color: "#fdcb6e", video: "1080p" };
  if (avgSpeed >= 5) return { text: "Средне", color: "#fdcb6e", video: "720p" };
  return { text: "Плохо", color: "#d63031", video: "360p" };
}

async function findServer() {
  for (const url of SERVERS) {
    try {
      const ws = new WebSocket(url);
      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          ws.close();
          resolve();
        };
        ws.onerror = () => reject();
        setTimeout(() => reject(), 2000);
      });
      return url;
    } catch {
      continue;
    }
  }
  return null;
}

async function measurePing(ws) {
  const pings = [];

  for (let i = 0; i < 10; i++) {
    const start = performance.now();

    ws.send(JSON.stringify({ type: "ping" }));

    await new Promise((resolve) => {
      const handler = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "pong") {
          ws.removeEventListener("message", handler);
          resolve();
        }
      };
      ws.addEventListener("message", handler);
    });

    const end = performance.now();
    pings.push(Math.round(end - start));

    if (i < 9) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  pings.sort((a, b) => a - b);
  return pings[Math.floor(pings.length / 2)];
}

async function measureDownload(ws, durationSec, progressBar, speedText) {
  return new Promise((resolve) => {
    let totalBytes = 0;
    const startTime = performance.now();
    let lastUpdate = startTime;

    const handler = (e) => {
      if (typeof e.data === "string") {
        try {
          JSON.parse(e.data);
          return;
        } catch {}
        totalBytes += e.data.length;
      } else if (e.data instanceof Blob) {
        totalBytes += e.data.size;
      } else if (e.data instanceof ArrayBuffer) {
        totalBytes += e.data.byteLength;
      }

      const now = performance.now();
      if (now - lastUpdate > 150) {
        lastUpdate = now;
        const elapsed = (now - startTime) / 1000;
        const percent = Math.min((elapsed / durationSec) * 100, 100);
        progressBar.style.width = percent + "%";
        const totalMB = totalBytes / 1000000;
        const speed = (totalMB / elapsed) * 8;
        speedText.textContent = speed.toFixed(1) + " Мбит/с";
      }
    };

    ws.addEventListener("message", handler);

    ws.send(JSON.stringify({
      type: "download",
      size: 1000000000,
      threads: 4
    }));

    setTimeout(() => {
      ws.removeEventListener("message", handler);
      ws.send(JSON.stringify({ type: "stop" }));
      const totalTime = (performance.now() - startTime) / 1000;
      const totalMB = totalBytes / 1000000;
      resolve((totalMB / totalTime) * 8);
    }, durationSec * 1000);
  });
}

async function measureUpload(ws, durationSec, progressBar, speedText) {
  return new Promise((resolve) => {
    let totalBytes = 0;
    const startTime = performance.now();
    let lastUpdate = startTime;
    let stopped = false;

    async function sendData() {
      while (!stopped) {
        const data = new Uint8Array(50000);
        for (let i = 0; i < 50000; i++) {
          data[i] = Math.floor(Math.random() * 256);
        }

        if (ws.readyState === WebSocket.OPEN && !stopped) {
          ws.send(data);
          totalBytes += 50000;
        }

        await new Promise(r => setTimeout(r, 0));
      }
    }

    sendData();

    const updateInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      const percent = Math.min((elapsed / durationSec) * 100, 100);
      progressBar.style.width = percent + "%";
      const totalMB = totalBytes / 1000000;
      const speed = (totalMB / elapsed) * 8;
      speedText.textContent = speed.toFixed(1) + " Мбит/с";
    }, 150);

    setTimeout(() => {
      stopped = true;
      clearInterval(updateInterval);
      const totalTime = (performance.now() - startTime) / 1000;
      const totalMB = totalBytes / 1000000;
      resolve((totalMB / totalTime) * 8);
    }, durationSec * 1000);
  });
}

speedStart.onclick = async () => {
  speedStart.disabled = true;

  speedResult.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:15px;margin-bottom:12px;color:#888;">Поиск сервера...</div>
      <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
        <div id="progress" style="width:25%;height:100%;background:#fdcb6e;border-radius:2px;"></div>
      </div>
    </div>
  `;

  try {
    const serverUrl = await findServer();

    if (!serverUrl) {
      throw new Error("Нет доступных серверов");
    }

    const ws = new WebSocket(serverUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      setTimeout(() => reject(new Error("Таймаут подключения")), 5000);
    });

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:15px;margin-bottom:12px;color:#888;">Измерение загрузки...</div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#00b894;border-radius:2px;transition:width 0.1s;"></div>
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
      </div>
    `;

    const downloadResult = await measureDownload(ws, 15, document.getElementById("progress"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#00b894;margin-bottom:15px;">Загрузка: ${downloadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:15px;margin-bottom:8px;color:#888;">Измерение отдачи...</div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#0984e3;border-radius:2px;transition:width 0.1s;"></div>
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
      </div>
    `;

    const uploadResult = await measureUpload(ws, 12, document.getElementById("progress"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#00b894;margin-bottom:4px;">Загрузка: ${downloadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:20px;font-weight:700;color:#0984e3;margin-bottom:15px;">Отдача: ${uploadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:15px;margin-bottom:8px;color:#888;">Измерение задержки...</div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#fdcb6e;border-radius:2px;transition:width 0.3s;"></div>
        </div>
      </div>
    `;

    const ping = await measurePing(ws);

    ws.close();

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
  } catch (e) {
    speedResult.innerHTML = `
      <div style="text-align:center;font-size:16px;color:#d63031;">Ошибка теста</div>
      <div style="text-align:center;font-size:14px;color:#888;margin-top:8px;">${e.message || "Проверьте подключение"}</div>
    `;
  } finally {
    speedStart.disabled = false;
  }
};
