import { describe, it, expect } from "vitest";

interface TestSession {
  id: number;
  slug: string;
  nama: string;
  is_active: boolean;
}

describe("Session Management & Active Status Logic", () => {
  const mockSessions: TestSession[] = [
    { id: 1, slug: "hari-1", nama: "Hari Pertama", is_active: true },
    { id: 2, slug: "hari-2", nama: "Hari Kedua", is_active: false },
    { id: 3, slug: "hari-3", nama: "Hari Ketiga", is_active: true },
  ];

  it("mendeteksi sesi aktif dan nonaktif dengan benar", () => {
    const activeSessions = mockSessions.filter((s) => s.is_active);
    const inactiveSessions = mockSessions.filter((s) => !s.is_active);

    expect(activeSessions.length).toBe(2);
    expect(activeSessions.map((s) => s.id)).toEqual([1, 3]);

    expect(inactiveSessions.length).toBe(1);
    expect(inactiveSessions[0].id).toBe(2);
  });

  it("mengizinkan presensi hanya jika status is_active bernilai true", () => {
    function canSubmitAttendance(session: TestSession): boolean {
      return session.is_active;
    }

    expect(canSubmitAttendance(mockSessions[0])).toBe(true);
    expect(canSubmitAttendance(mockSessions[1])).toBe(false);
    expect(canSubmitAttendance(mockSessions[2])).toBe(true);
  });

  it("dapat mengubah status sesi (buka/tutup)", () => {
    function toggleSession(sessions: TestSession[], id: number, nextStatus: boolean): TestSession[] {
      return sessions.map((s) => (s.id === id ? { ...s, is_active: nextStatus } : s));
    }

    const updated = toggleSession(mockSessions, 2, true);
    const session2 = updated.find((s) => s.id === 2);
    expect(session2?.is_active).toBe(true);

    const closed = toggleSession(updated, 1, false);
    const session1 = closed.find((s) => s.id === 1);
    expect(session1?.is_active).toBe(false);
  });

  it("memiliki 3 sesi lengkap (Hari Pertama, Hari Kedua, Hari Ketiga)", () => {
    expect(mockSessions.map((s) => s.slug)).toEqual(["hari-1", "hari-2", "hari-3"]);
  });
});
