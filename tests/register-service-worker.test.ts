import { afterEach, describe, expect, it, vi } from "vitest";

// Jalankan efek langsung (tanpa DOM): cukup untuk menguji keputusan daftar/lepas service worker.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
}));

import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";

function fakeServiceWorker() {
  const unregister = vi.fn(async () => true);
  const sw = {
    register: vi.fn(async () => ({})),
    getRegistrations: vi.fn(async () => [{ unregister }, { unregister }]),
  };
  vi.stubGlobal("navigator", { serviceWorker: sw });
  return { sw, unregister };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("RegisterServiceWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("production: mendaftarkan /sw.js", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { sw } = fakeServiceWorker();
    RegisterServiceWorker();
    await flush();
    expect(sw.register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
  });

  it("development: tidak mendaftar, worker sisa dilepas (tanpa error di konsol)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { sw, unregister } = fakeServiceWorker();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    RegisterServiceWorker();
    await flush();
    expect(sw.register).not.toHaveBeenCalled();
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
