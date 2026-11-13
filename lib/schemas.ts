import { z } from "zod";

export const attendanceSchema = z.object({
  sessionId: z.union([z.literal(1), z.literal(2)]),
  guestId: z.string().uuid().optional(),
  nama: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  perwakilanDaerah: z
    .string()
    .min(2, "Perwakilan daerah minimal 2 karakter")
    .max(100, "Perwakilan daerah maksimal 100 karakter"),
  website: z.string().optional(),
});

export const guestRowSchema = z.object({
  nama: z.string().min(2).max(100),
  perwakilan_daerah: z.string().min(2).max(100),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type GuestRowInput = z.infer<typeof guestRowSchema>;
