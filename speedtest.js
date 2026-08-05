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
      <div style="display:flex;align-items:end;gap:2px;height:60px;margin-bottom:8px;" id="bars"></div>
      <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
        <div id="progress" style="width:0%;height:100%;background:#00b894;border-radius:2px;transition:width 0.08s;"></div>
      </div>
      <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
    </div>
  `;

  try {
    const downloadResult = await measureDownload(12, document.getElementById("progress"), document.getElementById("bars"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#00b894;margin-bottom:15px;">Загрузка: ${downloadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:15px;margin-bottom:8px;color:#888;">Измерение отдачи...</div>
        <div style="display:flex;align-items:end;gap:2px;height:60px;margin-bottom:8px;" id="bars"></div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#0984e3;border-radius:2px;transition:width 0.08s;"></div>
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
      </div>
    `;

    const uploadResult = await measureUpload(12, document.getElementById("progress"), document.getElementById("bars"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;color:#00b894;margin-bottom:4px;">Загрузка: ${downloadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:20px;font-weight:700;color:#0984e3;margin-bottom:15px;">Отдача: ${uploadResult.toFixed(1)} Мбит/с</div>
        <div style="font-size:15px;margin-bottom:8px;color:#888;">Измерение задержки...</div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow-hidden;">
          <div id="progress" style="width:0%;height:100%;background:#fdcb6e;border-radius:2px;transition:width 0.3s;"></div>
        </div>
      </div>
    `;

    let ping = 0;
    const pingStart = performance.now();
    await fetch("https://speed.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    const pingEnd = performance.now();
    ping = Math.round(pingEnd - pingStart);

    document.getElementById("progress").style.width = "100%";

    await new Promise(r => setTimeout(r, 500));

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

async function measureDownload(duration, progressBar, barsContainer, speedText) {
  const speeds = [];
  const startTime = performance.now();

  while (performance.now() - startTime < duration * 1000) {
    const file = `https://speed.cloudflare.com/__down?bytes=500000&r=${Math.random()}`;
    const reqStart = performance.now();

    const response = await fetch(file, { cache: "no-store" });
    await response.arrayBuffer();

    const reqEnd = performance.now();
    const seconds = (reqEnd - reqStart) / 1000;
    const speed = (0.5 / seconds) * 8;
    speeds.push(speed);

    const elapsed = (performance.now() - startTime) / 1000;
    const percent = Math.min((elapsed / duration) * 100, 100);
    progressBar.style.width = percent + "%";

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    speedText.textContent = avgSpeed.toFixed(1) + " Мбит/с";

    const maxSpeed = Math.max(...speeds, 1);
    const barHeight = (speed / maxSpeed) * 60;
    const bar = document.createElement("div");
    bar.style.cssText = `flex:1;background:#00b894;border-radius:1px 1px 0 0;height:${barHeight}px;min-width:2px;`;
    barsContainer.appendChild(bar);

    if (barsContainer.children.length > 50) {
      barsContainer.removeChild(barsContainer.firstChild);
    }
  }

  return speeds.reduce((a, b) => a + b, 0) / speeds.length;
}

async function measureUpload(duration, progressBar, barsContainer, speedText) {
  const speeds = [];
  const startTime = performance.now();

  while (performance.now() - startTime < duration * 1000) {
    const data = new Uint8Array(200000);
    for (let i = 0; i < 200000; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }

    const reqStart = performance.now();

    try {
      await fetch("https://speed.cloudflare.com/__up", {
        method: "POST",
        cache: "no-store",
        body: data
      });
    } catch {
      continue;
    }

    const reqEnd = performance.now();
    const seconds = (reqEnd - reqStart) / 1000;
    const speed = (0.2 / seconds) * 8;
    speeds.push(speed);

    const elapsed = (performance.now() - startTime) / 1000;
    const percent = Math.min((elapsed / duration) * 100, 100);
    progressBar.style.width = percent + "%";

    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    speedText.textContent = avgSpeed.toFixed(1) + " Мбит/с";

    const maxSpeed = Math.max(...speeds, 1);
    const barHeight = (speed / maxSpeed) * 60;
    const bar = document.createElement("div");
    bar.style.cssText = `flex:1;background:#0984e3;border-radius:1px 1px 0 0;height:${barHeight}px;min-width:2px;`;
    barsContainer.appendChild(bar);

    if (barsContainer.children.length > 50) {
      barsContainer.removeChild(barsContainer.firstChild);
    }
  }

  return speeds.reduce((a, b) => a + b, 0) / speeds.length;
}