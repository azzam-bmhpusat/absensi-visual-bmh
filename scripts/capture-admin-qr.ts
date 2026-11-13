import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PROFILE_DIR = "C:\\Users\\muhaz\\.gemini\\antigravity\\brain\\f319e97e-1e0e-4253-b059-55460b299db9\\edge-temp-profile";
const SCREENSHOT_DIR = "C:\\Users\\muhaz\\.gemini\\antigravity\\brain\\f319e97e-1e0e-4253-b059-55460b299db9\\screenshots";

function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      res.on("error", reject);
    });
  });
}

class CdpClient {
  ws: WebSocket;
  id = 1;
  callbacks = new Map<number, (res: any) => void>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  waitOpen(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
    });
  }

  send(method: string, params: any = {}): Promise<any> {
    const msgId = this.id++;
    return new Promise((resolve) => {
      this.callbacks.set(msgId, resolve);
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  init() {
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id)!;
        this.callbacks.delete(msg.id);
        cb(msg.result);
      }
    };
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Launch Edge headless with debugging port 9222
  console.log("Launching Edge headless with CDP...");
  const proc = spawn(
    EDGE_PATH,
    [
      "--headless=new",
      "--remote-debugging-port=9222",
      `--user-data-dir=${PROFILE_DIR}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  try {
    await sleep(2000);
    const tabs = await getJson("http://localhost:9222/json");
    const pageTab = tabs.find((t: any) => t.type === "page");
    if (!pageTab || !pageTab.webSocketDebuggerUrl) {
      throw new Error("No page tab found with webSocketDebuggerUrl");
    }

    const cdp = new CdpClient(pageTab.webSocketDebuggerUrl);
    cdp.init();
    await cdp.waitOpen();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // 1. Navigate to login page
    console.log("Navigating to http://localhost:3000/admin/login...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/login" });
    await sleep(2500);

    // 2. Fill login credentials
    console.log("Submitting login form...");
    const fillResult = await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const emailInput = document.querySelector('input[type="email"], input[name="email"]');
          const passInput = document.querySelector('input[type="password"], input[name="password"]');
          const submitBtn = document.querySelector('button[type="submit"]');
          if (!emailInput || !passInput || !submitBtn) return { error: "inputs not found" };

          emailInput.value = "admin@bmh.or.id";
          emailInput.dispatchEvent(new Event("input", { bubbles: true }));
          emailInput.dispatchEvent(new Event("change", { bubbles: true }));

          passInput.value = "www.bmh.or.id";
          passInput.dispatchEvent(new Event("input", { bubbles: true }));
          passInput.dispatchEvent(new Event("change", { bubbles: true }));

          submitBtn.click();
          return { ok: true };
        })()
      `,
      returnByValue: true,
    });
    console.log("Login form action result:", fillResult?.value);

    // Wait for login and auth cookies
    await sleep(3500);

    // 3. Navigate to /admin/qr
    console.log("Navigating to http://localhost:3000/admin/qr...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/qr" });
    await sleep(3000);

    // 4. Capture at viewports: 1366, 1440, 1920, 2560
    const resolutions = [
      { w: 1366, h: 768, name: "admin-qr-1366.png" },
      { w: 1440, h: 900, name: "admin-qr-1440.png" },
      { w: 1920, h: 1080, name: "admin-qr-1920.png" },
      { w: 2560, h: 1440, name: "admin-qr-2560.png" },
    ];

    for (const res of resolutions) {
      console.log(`Setting viewport ${res.w}x${res.h}...`);
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: res.w,
        height: res.h,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await cdp.send("Emulation.setEmulatedMedia", { media: "" });
      await sleep(1000);

      const shot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });

      const outPath = path.join(SCREENSHOT_DIR, res.name);
      fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
      console.log(`Saved screenshot: ${outPath} (${fs.statSync(outPath).size} bytes)`);
    }

    // 5. Capture Print Media Preview
    console.log("Capturing print media emulation...");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1200,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Emulation.setEmulatedMedia", { media: "print" });
    await sleep(1000);

    const printShot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const printPath = path.join(SCREENSHOT_DIR, "admin-qr-print-preview.png");
    fs.writeFileSync(printPath, Buffer.from(printShot.data, "base64"));
    console.log(`Saved print preview: ${printPath} (${fs.statSync(printPath).size} bytes)`);

    cdp.close();
  } finally {
    proc.kill();
  }
}

main().catch((err) => {
  console.error("Error in capture script:", err);
  process.exit(1);
});
