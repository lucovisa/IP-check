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

function getVideoQuality(speed) {
  if (speed < 5) return "360p";
  if (speed < 10) return "720p";
  if (speed < 25) return "1080p";
  if (speed < 50) return "1440p";
  return "4K";
}

function getOverallQuality(ping, download, upload) {
  let score = 0;
  if (ping < 30) score += 3;
  else if (ping < 80) score += 2;
  else if (ping < 150) score += 1;
  else score += 0;

  if (download >= 50) score += 3;
  else if (download >= 25) score += 2;
  else if (download >= 10) score += 1;
  else score += 0;

  if (upload >= 25) score += 3;
  else if (upload >= 10) score += 2;
  else if (upload >= 5) score += 1;
  else score += 0;

  if (score >= 7) return { text: "Отлично", color: "#00b894" };
  if (score >= 5) return { text: "Хорошо", color: "#0984e3" };
  if (score >= 3) return { text: "Средне", color: "#fdcb6e" };
  return { text: "Плохо", color: "#d63031" };
}

function getPingQuality(ping) {
  if (ping < 30) return { text: "Отлично", color: "#00b894" };
  if (ping < 80) return { text: "Хорошо", color: "#0984e3" };
  if (ping < 150) return { text: "Средне", color: "#fdcb6e" };
  return { text: "Плохо", color: "#d63031" };
}

speedStart.onclick = async () => {
  speedStart.disabled = true;

  speedResult.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:15px;margin-bottom:12px;color:#888;">Измерение задержки...</div>
      <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
        <div id="progress" style="width:0%;height:100%;background:#fdcb6e;border-radius:2px;transition:width 0.1s;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-top:3px;">
        <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
      </div>
    </div>
  `;

  const progress = document.getElementById("progress");

  try {
    progress.style.width = "25%";
    const pingStart = performance.now();
    await fetch("https://speed.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    const pingEnd = performance.now();
    const ping = Math.round(pingEnd - pingStart);
    progress.style.width = "100%";

    await new Promise(r => setTimeout(r, 500));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:14px;color:#888;margin-bottom:4px;">Задержка</div>
        <div style="font-size:32px;font-weight:700;color:#fdcb6e;margin-bottom:15px;">${ping}<span style="font-size:16px;"> мс</span></div>
        <div style="font-size:15px;margin-bottom:8px;">Измерение загрузки...</div>
        <div style="display:flex;align-items:end;gap:2px;height:80px;margin-bottom:8px;" id="bars"></div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#00b894;border-radius:2px;transition:width 0.1s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-top:3px;">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
      </div>
    `;

    const downloadResult = await measureDownload(15, document.getElementById("progress"), document.getElementById("bars"), document.getElementById("currentSpeed"));

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:14px;color:#888;margin-bottom:4px;">Задержка</div>
        <div style="font-size:32px;font-weight:700;color:#fdcb6e;margin-bottom:4px;">${ping}<span style="font-size:16px;"> мс</span></div>
        <div style="font-size:22px;font-weight:700;color:#00b894;margin:8px 0 2px;">${downloadResult.toFixed(1)}<span style="font-size:14px;"> Мбит/с</span></div>
        <div style="font-size:12px;color:#888;margin-bottom:15px;">Видео ${getVideoQuality(downloadResult)}</div>
        <div style="font-size:15px;margin-bottom:8px;">Измерение отдачи...</div>
        <div style="display:flex;align-items:end;gap:2px;height:80px;margin-bottom:8px;" id="bars"></div>
        <div style="width:100%;height:4px;background:#1b1b1b;border-radius:2px;overflow:hidden;">
          <div id="progress" style="width:0%;height:100%;background:#0984e3;border-radius:2px;transition:width 0.1s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-top:3px;">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;" id="currentSpeed">0 Мбит/с</div>
      </div>
    `;

    const uploadResult = await measureUpload(15, document.getElementById("progress"), document.getElementById("bars"), document.getElementById("currentSpeed"));

    const overallQuality = getOverallQuality(ping, downloadResult, uploadResult);
    const pingQuality = getPingQuality(ping);

    speedResult.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:14px;color:#888;margin-bottom:8px;">Общая оценка</div>
        <div style="font-size:36px;font-weight:700;color:${overallQuality.color};margin-bottom:15px;">${overallQuality.text}</div>
        <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;">
          <div>
            <div style="font-size:12px;color:#888;">Задержка</div>
            <div style="font-size:24px;font-weight:700;color:${pingQuality.color};">${ping}<span style="font-size:12px;"> мс</span></div>
          </div>
          <div>
            <div style="font-size:12px;color:#888;">Загрузка</div>
            <div style="font-size:24px;font-weight:700;color:#00b894;">${downloadResult.toFixed(1)}<span style="font-size:12px;"> Мбит/с</span></div>
            <div style="font-size:11px;color:#888;">Видео ${getVideoQuality(downloadResult)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:#888;">Отдача</div>
            <div style="font-size:24px;font-weight:700;color:#0984e3;">${uploadResult.toFixed(1)}<span style="font-size:12px;"> Мбит/с</span></div>
            <div style="font-size:11px;color:#888;">Видео ${getVideoQuality(uploadResult)}</div>
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
    const barHeight = (speed / maxSpeed) * 80;
    const bar = document.createElement("div");
    bar.style.cssText = `flex:1;background:#00b894;border-radius:1px 1px 0 0;height:${barHeight}px;min-width:2px;`;
    barsContainer.appendChild(bar);

    if (barsContainer.children.length > 60) {
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
    const barHeight = (speed / maxSpeed) * 80;
    const bar = document.createElement("div");
    bar.style.cssText = `flex:1;background:#0984e3;border-radius:1px 1px 0 0;height:${barHeight}px;min-width:2px;`;
    barsContainer.appendChild(bar);

    if (barsContainer.children.length > 60) {
      barsContainer.removeChild(barsContainer.firstChild);
    }
  }

  return speeds.reduce((a, b) => a + b, 0) / speeds.length;
}