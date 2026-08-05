const speedStart = document.getElementById("speedStart");
const speedResult = document.getElementById("speedResult");

speedStart.onclick = async () => {
  speedStart.disabled = true;
  speedResult.innerHTML = `
    <div style="margin-bottom:15px;">Измерение пинга...</div>
    <div style="width:100%;height:6px;background:#1b1b1b;border-radius:3px;overflow:hidden;">
      <div id="progressBar" style="width:0%;height:100%;background:white;border-radius:3px;transition:width 0.3s;"></div>
    </div>
  `;

  const progressBar = document.getElementById("progressBar");

  try {
    const pingStart = performance.now();
    await fetch("https://speed.cloudflare.com/cdn-cgi/trace", {
      cache: "no-store"
    });
    const pingEnd = performance.now();
    const ping = Math.round(pingEnd - pingStart);

    speedResult.innerHTML = `
      <div style="margin-bottom:15px;">Пинг: <b>${ping} мс</b><br>Тестирование скорости...</div>
      <div style="width:100%;height:6px;background:#1b1b1b;border-radius:3px;overflow-hidden;">
        <div id="progressBar" style="width:0%;height:100%;background:white;border-radius:3px;transition:width 0.3s;"></div>
      </div>
    `;

    const progressBar2 = document.getElementById("progressBar");
    const fileSize = 10;
    const file = `https://speed.cloudflare.com/__down?bytes=${fileSize * 1000000}`;

    const start = performance.now();

    const response = await fetch(file, {
      cache: "no-store"
    });

    const reader = response.body.getReader();
    const contentLength = +response.headers.get("Content-Length");
    let received = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      const percent = (received / contentLength) * 100;
      progressBar2.style.width = percent + "%";
    }

    const end = performance.now();
    const seconds = (end - start) / 1000;
    const speed = (fileSize / seconds) * 8;

    let quality = "";
    let color = "";

    if (speed < 5) {
      quality = "Медленно";
      color = "#d63031";
    } else if (speed < 25) {
      quality = "Средне";
      color = "#fdcb6e";
    } else if (speed < 100) {
      quality = "Хорошо";
      color = "#00b894";
    } else {
      quality = "Отлично";
      color = "#0984e3";
    }

    speedResult.innerHTML = `
      <div style="font-size:16px;margin-bottom:8px;">Пинг: <b>${ping} мс</b></div>
      <div style="font-size:28px;font-weight:700;margin:10px 0;">${speed.toFixed(2)} Мбит/с</div>
      <div style="font-size:18px;font-weight:600;color:${color};margin-bottom:12px;">${quality}</div>
      <div style="width:100%;height:6px;background:#1b1b1b;border-radius:3px;overflow-hidden;">
        <div style="width:100%;height:100%;background:${color};border-radius:3px;"></div>
      </div>
    `;
  } catch {
    speedResult.innerHTML = `
      <div style="font-size:16px;color:#d63031;">Ошибка теста</div>
      <div style="font-size:14px;color:#888;margin-top:8px;">Проверьте подключение и попробуйте снова</div>
    `;
  } finally {
    speedStart.disabled = false;
  }
};