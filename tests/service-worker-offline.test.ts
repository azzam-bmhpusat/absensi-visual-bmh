import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const publicDir = path.resolve(import.meta.dirname, "../public");
const source = readFileSync(path.join(publicDir, "sw.js"), "utf8");
const origin = "https://rakernas.example";
const logoPath = "/logo-rakernas-nav.png";

type WorkerRequest = Pick<Request, "url" | "method" | "mode">;
type CacheRequest = string | WorkerRequest;

function createWorker(storage = new Map<string, Map<string, Response>>()) {
  const listeners = new Map<string, (event: unknown) => void>();
  const cacheKey = (request: CacheRequest) =>
    new URL(typeof request === "string" ? request : request.url, origin).href;
  const caches = {
    open: vi.fn(async (name: string) => {
      if (!storage.has(name)) storage.set(name, new Map());
      const entries = storage.get(name)!;
      return {
        addAll: async (urls: string[]) => {
          const responses = urls.map((url) => [
            cacheKey(url),
            new Response(readFileSync(path.join(publicDir, url))),
          ] as const);
          for (const [key, response] of responses) entries.set(key, response);
        },
        match: async (request: CacheRequest) => entries.get(cacheKey(request))?.clone(),
      };
    }),
    keys: async () => [...storage.keys()],
    delete: vi.fn(async (name: string) => storage.delete(name)),
    match: async (request: CacheRequest) => {
      for (const entries of storage.values()) {
        const response = entries.get(cacheKey(request));
        if (response) return response.clone();
      }
    },
  };
  const fetch = vi.fn<(request: WorkerRequest) => Promise<Response>>(async () => new Response("online"));
  const skipWaiting = vi.fn(async () => {});
  const claim = vi.fn(async () => {});
  runInNewContext(source, {
    self: {
      location: { origin },
      addEventListener: (name: string, listener: (event: unknown) => void) =>
        listeners.set(name, listener),
      skipWaiting,
      clients: { claim },
    },
    caches,
    fetch,
    URL,
    Response,
  });

  return {
    storage, caches, fetch, skipWaiting, claim,
    async lifecycle(name: "install" | "activate") {
      let pending: Promise<unknown> | undefined;
      listeners.get(name)!({ waitUntil: (promise: Promise<unknown>) => { pending = promise; } });
      expect(pending).toBeDefined();
      await pending;
    },
    request(url: string, mode: RequestMode = "no-cors", method = "GET") {
      let response: Promise<Response> | undefined;
      listeners.get("fetch")!({
        request: { url: new URL(url, origin).href, mode, method },
        respondWith: (promise: Promise<Response>) => { response = promise; },
      });
      return response;
    },
  };
}

describe("Service worker: logo Rakernas saat offline", () => {
  it("menyimpan halaman offline beserta logo yang dirujuk sebelum aktivasi", async () => {
    const worker = createWorker();
    await worker.lifecycle("install");
    const offline = await worker.caches.match("/offline.html");
    expect(await offline?.text()).toContain(`src="${logoPath}"`);
    const logo = await worker.caches.match(logoPath);
    expect(Buffer.from(await logo!.arrayBuffer())).toEqual(
      readFileSync(path.join(publicDir, logoPath)),
    );
    expect(worker.skipWaiting).toHaveBeenCalledOnce();
  });

  it("mengganti cache versi lama dengan cache baru yang berisi logo", async () => {
    const worker = createWorker();
    worker.storage.set("bmh-offline-v2", new Map());
    await worker.lifecycle("install");
    await worker.lifecycle("activate");
    expect([...worker.storage.keys()]).toEqual(["bmh-offline-v3"]);
    expect(await worker.caches.match(logoPath)).toBeDefined();
    expect(worker.claim).toHaveBeenCalledOnce();
  });

  it.each([logoPath, "/icons/icon-192.png"])(
    "melayani %s dari cache tanpa jaringan setelah worker dimulai ulang",
    async (asset) => {
      const installed = createWorker();
      await installed.lifecycle("install");
      const restarted = createWorker(installed.storage);
      restarted.fetch.mockRejectedValue(new TypeError("offline"));
      const response = await restarted.request(asset);
      expect(response?.ok).toBe(true);
      expect(Buffer.from(await response!.arrayBuffer())).toEqual(
        readFileSync(path.join(publicDir, asset)),
      );
      expect(restarted.fetch).not.toHaveBeenCalled();
    },
  );

  it("menggunakan jaringan bila logo belum tersedia di cache", async () => {
    const worker = createWorker();
    const response = await worker.request(logoPath);
    expect(await response?.text()).toBe("online");
    expect(worker.fetch).toHaveBeenCalledOnce();
  });

  it("menampilkan halaman offline dengan logo saat navigasi gagal", async () => {
    const worker = createWorker();
    await worker.lifecycle("install");
    worker.fetch.mockRejectedValue(new TypeError("offline"));
    const response = await worker.request("/rundown", "navigate");
    expect(await response?.text()).toContain(`src="${logoPath}"`);
    expect((await worker.request(logoPath))?.ok).toBe(true);
  });

  it("kembali menggunakan jaringan ketika koneksi pulih", async () => {
    const worker = createWorker();
    await worker.lifecycle("install");
    worker.fetch.mockRejectedValueOnce(new TypeError("offline"));
    expect(await (await worker.request("/rundown", "navigate"))?.text()).toContain("Anda sedang offline");
    expect(await (await worker.request("/rundown", "navigate"))?.text()).toBe("online");
    expect(await worker.caches.match("/rundown")).toBeUndefined();
  });

  it.each([
    ["/api/admin/absen-qr", "cors", "GET"],
    [logoPath, "no-cors", "POST"],
    [`https://other.example${logoPath}`, "no-cors", "GET"],
    ["https://other.example/", "navigate", "GET"],
    ["/other-image.png", "no-cors", "GET"],
  ] as const)("tidak menangani %s (%s, %s)", (url, mode, method) => {
    const worker = createWorker();
    expect(worker.request(url, mode, method)).toBeUndefined();
    expect(worker.fetch).not.toHaveBeenCalled();
    expect(worker.caches.open).not.toHaveBeenCalled();
  });
});
