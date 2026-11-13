"use server";

import { attendanceSchema, type AttendanceInput } from "@/lib/schemas";

export type SubmitAttendanceResponse =
  | { status: "ok"; nama: string; sesi: string }
  | { status: "already"; message: string }
  | { status: "error"; message?: string; fieldErrors?: Record<string, string[]> };

export async function submitAttendance(
  _data: AttendanceInput
): Promise<SubmitAttendanceResponse> {
  // Placeholder untuk Fase 2
  const parsed = attendanceSchema.safeParse(_data);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    status: "ok",
    nama: parsed.data.nama,
    sesi: parsed.data.sessionId === 1 ? "Hari Pertama" : "Hari Kedua",
  };
}
