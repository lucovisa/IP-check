const axios = require("axios");
const dns = require("dns").promises;
const requests = new Map();
const bans = new Map();

const REQUEST_LIMIT = 30;
const REQUEST_WINDOW = 10000;
const BAN_TIME = 300000;

function getBrowser(ua) {
  let match;

  if (ua.includes("Edg")) {
    match = ua.match(/Edg\/([\d.]+)/);
    return {
      name: "Microsoft Edge",
      version: match ? match[1] : "Неизвестно"
    };
  }

  if (ua.includes("Chrome")) {
    match = ua.match(/Chrome\/([\d.]+)/);
    return {
      name: "Google Chrome",
      version: match ? match[1] : "Неизвестно"
    };
  }

  if (ua.includes("Firefox")) {
    match = ua.match(/Firefox\/([\d.]+)/);
    return {
      name: "Mozilla Firefox",
      version: match ? match[1] : "Неизвестно"
    };
  }

  if (ua.includes("Safari")) {
    match = ua.match(/Version\/([\d.]+)/);
    return {
      name: "Safari",
      version: match ? match[1] : "Неизвестно"
    };
  }

  return {
    name: "Неизвестно",
    version: "Неизвестно"
  };
}

function getOS(ua) {
  if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Windows")) return "Windows";

  if (ua.includes("Android")) {
    const match = ua.match(/Android\s([\d.]+)/);
    return match ? `Android ${match[1]}` : "Android";
  }

  if (ua.includes("iPhone") || ua.includes("iPad")) {
    const match = ua.match(/OS\s(\d+_\d+)/);
    return match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
  }

  if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X\s([\d_]+)/);
    return match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  }

  if (ua.includes("Linux")) return "Linux";

  return "Неизвестная ОС";
}

function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let ip = req.query.ip;

    if (!ip) {
      ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
    }

    if (ip && ip.includes("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    if (ip && !isValidIP(ip)) {
      return res.status(400).json({
        success: false,
        error: "Невалидный IP-адрес"
      });
    }

    const now = Date.now();

    if (bans.has(ip)) {
      const expires = bans.get(ip);
      if (now < expires) {
        return res.status(429).json({
          success: false,
          banned: true,
          remaining: Math.ceil((expires - now) / 1000)
        });
      }
      bans.delete(ip);
    }

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const history = requests.get(ip);

    while (history.length && now - history[0] > REQUEST_WINDOW) {
      history.shift();
    }

    history.push(now);

    if (history.length >= REQUEST_LIMIT) {
      bans.set(ip, now + BAN_TIME);
      requests.delete(ip);

      return res.status(429).json({
        success: false,
        banned: true,
        remaining: 300
      });
    }

    const ua = req.headers["user-agent"] || "";
    const browser = getBrowser(ua);
    const os = getOS(ua);

    console.log(`[${new Date().toLocaleString()}] ${ip} ${browser.name} ${os}`);

    const response = await axios.get(`https://ipwho.is/${ip}`, {
      timeout: 5000
    });

    const data = response.data;

    if (!data.success) {
      return res.status(400).json({
        success: false,
        error: data.message || "Не удалось получить данные об IP"
      });
    }

    const connection = data.connection || {};
    data.providerSite = connection.domain
      ? "https://" + connection.domain
      : null;

    let hostname = "Нет данных";

    try {
      const result = await dns.reverse(ip);
      hostname = result[0] || "Нет данных";
    } catch {
      hostname = "Нет данных";
    }

    data.dns = {
      hostname
    };

    data.device = {
      browser: browser.name,
      browserVersion: browser.version,
      os,
      language: req.headers["accept-language"] || "Неизвестно",
      userAgent: ua
    };

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};