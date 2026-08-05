(function () {
  const banUntil = localStorage.getItem("banUntil");
  if (banUntil && Date.now() < parseInt(banUntil)) {
    if (!window.location.href.includes("ban.html")) {
      window.location.href = "ban.html";
    }
  }
})();

const check = document.getElementById("check");
const checkIp = document.getElementById("checkIp");
const ipInput = document.getElementById("ipInput");
const ipError = document.getElementById("ipError");
const result = document.getElementById("result");
const copyAll = document.getElementById("copyAll");
const downloadTxt = document.getElementById("downloadTxt");
const historyBox = document.getElementById("history");
const clearHistory = document.getElementById("clearHistory");

let currentData = "";

Object.defineProperty(window, "pleasebanme", {
  set() {
    localStorage.setItem("banUntil", Date.now() + 300000);
    window.location.href = "ban.html";
  }
});

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6ShortRegex = /^([0-9a-fA-F]{1,4}:){1,7}:$/;
  const ipv4MappedRegex = /^::ffff:(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ipv6ShortRegex.test(ip) || ipv4MappedRegex.test(ip);
}

async function loadIP(ip = "") {
  result.innerHTML = "Загрузка...";

  try {
    let url = "https://ip-check-livid.vercel.app/api/ip";

    if (ip) {
      url += `?ip=${encodeURIComponent(ip)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.banned) {
      localStorage.setItem("banUntil", Date.now() + data.remaining * 1000);
      window.location.href = "ban.html";
      return;
    }

    saveHistory(data);

    const connection = data.connection || {};
    const device = data.device || {};
    const dns = data.dns || {};
    const timezone = data.timezone || {};
    const flag = data.flag || {};

    currentData = `IP: ${data.ip || ""}
Страна: ${data.country || ""}
Регион: ${data.region || ""}
Город: ${data.city || ""}
Провайдер: ${connection.isp || ""}
Организация: ${connection.org || ""}
ASN: ${connection.asn || ""}
Часовой пояс: ${timezone.id || ""}
Координаты: ${data.latitude || ""}, ${data.longitude || ""}
Браузер: ${device.browser || ""}
ОС: ${device.os || ""}
Версия браузера: ${device.browserVersion || ""}
Язык: ${device.language || ""}
User-Agent: ${device.userAgent || ""}
DNS: ${dns.hostname || ""}`;

    const flagEmoji = flag.emoji ? " " + flag.emoji : "";
    const providerHTML = data.providerSite
      ? `<a href="${escapeHTML(data.providerSite)}" target="_blank" rel="noopener">${escapeHTML(connection.isp || "")}</a>`
      : escapeHTML(connection.isp || "");

    result.innerHTML = `
      ${field("IP", data.ip)}
      ${field("Страна", (data.country || "") + flagEmoji)}
      ${field("Регион", data.region)}
      ${field("Город", data.city)}
      ${field("Провайдер", providerHTML)}
      ${field("Организация", connection.org)}
      ${field("ASN", connection.asn)}
      ${field("Часовой пояс", timezone.id)}
      ${field("Координаты", `${data.latitude || ""}, ${data.longitude || ""}`)}
      ${field("Браузер", device.browser)}
      ${field("ОС", device.os)}
      ${field("Версия браузера", device.browserVersion)}
      ${field("Язык", device.language)}
      ${field("User-Agent", device.userAgent)}
      ${field("DNS", dns.hostname)}
      <button onclick="mapOpen('${data.latitude || 0}','${data.longitude || 0}')">
        Открыть на карте
      </button>
    `;

    copyAll.style.display = "block";
    downloadTxt.style.display = "block";
  } catch {
    result.innerHTML = "Ошибка подключения";
  }
}

function field(name, value) {
  return `
    <div class="info">
      <b>${escapeHTML(name || "")}</b>
      <span>${value || ""}</span>
    </div>
  `;
}

function copyText(text) {
  navigator.clipboard.writeText(text);
}

function mapOpen(lat, lon) {
  window.open(
    `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`,
    "_blank",
    "noopener"
  );
}

copyAll.onclick = () => {
  navigator.clipboard.writeText(currentData);
};

check.onclick = () => loadIP();

checkIp.onclick = () => {
  const ip = ipInput.value.trim();
  if (ip) {
    if (!isValidIP(ip)) {
      ipError.classList.add("show");
      setTimeout(() => ipError.classList.remove("show"), 2500);
      return;
    }
    ipError.classList.remove("show");
    loadIP(ip);
  }
};

ipInput.addEventListener("input", () => {
  ipError.classList.remove("show");
});

downloadTxt.onclick = () => {
  const blob = new Blob([currentData], {
    type: "text/plain;charset=utf-8"
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ip-report.txt";
  link.click();
  URL.revokeObjectURL(link.href);
};

function saveHistory(data) {
  let history = JSON.parse(localStorage.getItem("ipHistory")) || [];

  history.unshift({
    ip: data.ip || "",
    country: data.country || "",
    city: data.city || "",
    date: new Date().toLocaleString()
  });

  if (history.length > 10) {
    history = history.slice(0, 10);
  }

  localStorage.setItem("ipHistory", JSON.stringify(history));
  showHistory();
}

function showHistory() {
  let history = JSON.parse(localStorage.getItem("ipHistory")) || [];
  historyBox.innerHTML = "";

  if (history.length === 0) {
    historyBox.textContent = "История пуста";
    return;
  }

  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <b>${escapeHTML(item.ip || "")}</b><br>
      ${escapeHTML(item.country || "")}<br>
      ${escapeHTML(item.city || "")}<br>
      <small>${escapeHTML(item.date || "")}</small>
    `;
    historyBox.appendChild(div);
  });
}

clearHistory.onclick = () => {
  localStorage.removeItem("ipHistory");
  showHistory();
};

showHistory();