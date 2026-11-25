import { describe, it, expect } from "vitest";
import { attendanceSchema, guestRowSchema } from "../lib/schemas";

describe("attendanceSchema", () => {
  const validInput = {
    sessionId: 1 as const,
    nama: "Ahmad Dahlan",
    perwakilanDaerah: "BMH Jawa Timur",
  };

  it("menerima input valid sesi 1", () => {
    const result = attendanceSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe(1);
      expect(result.data.nama).toBe("Ahmad Dahlan");
    }
  });

  it("menerima input valid sesi 2", () => {
    const result = attendanceSchema.safeParse({ ...validInput, sessionId: 2 });
    expect(result.success).toBe(true);
  });

  it("menerima input valid sesi 3 hingga 9", () => {
    const result3 = attendanceSchema.safeParse({ ...validInput, sessionId: 3 });
    expect(result3.success).toBe(true);
    const result9 = attendanceSchema.safeParse({ ...validInput, sessionId: 9 });
    expect(result9.success).toBe(true);
    if (result9.success) {
      expect(result9.data.sessionId).toBe(9);
    }
  });

  it("menolak sessionId di luar rentang 1-9", () => {
    const result0 = attendanceSchema.safeParse({ ...validInput, sessionId: 0 });
    expect(result0.success).toBe(false);
    const result10 = attendanceSchema.safeParse({ ...validInput, sessionId: 10 });
    expect(result10.success).toBe(false);
  });

  it("trim dan kompres spasi ganda pada nama", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      nama: "  Ahmad   Dahlan  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nama).toBe("Ahmad Dahlan");
    }
  });

  it("trim dan kompres spasi ganda pada perwakilanDaerah", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      perwakilanDaerah: "  BMH   Jawa   Timur  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.perwakilanDaerah).toBe("BMH Jawa Timur");
    }
  });

  it("menolak nama kurang dari 2 karakter setelah trim", () => {
    const result = attendanceSchema.safeParse({ ...validInput, nama: " A " });
    expect(result.success).toBe(false);
  });

  it("menolak nama lebih dari 100 karakter", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      nama: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("menolak perwakilanDaerah kosong", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      perwakilanDaerah: "",
    });
    expect(result.success).toBe(false);
  });

  it("menerima guestId berformat UUID valid", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      guestId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guestId).toBe(
        "550e8400-e29b-41d4-a716-446655440000"
      );
    }
  });

  it("mengubah guestId string kosong menjadi undefined", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      guestId: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guestId).toBeUndefined();
    }
  });

  it("menerima guestId undefined", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      guestId: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guestId).toBeUndefined();
    }
  });

  it("menolak guestId bukan UUID", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      guestId: "bukan-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("menerima honeypot website kosong / undefined", () => {
    const r1 = attendanceSchema.safeParse({ ...validInput, website: "" });
    const r2 = attendanceSchema.safeParse({
      ...validInput,
      website: undefined,
    });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });

  it("menerima honeypot website terisi (tetap valid di level skema)", () => {
    const result = attendanceSchema.safeParse({
      ...validInput,
      website: "https://spam.example.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("guestRowSchema", () => {
  it("menerima baris CSV valid", () => {
    const result = guestRowSchema.safeParse({
      nama: "Siti Aminah",
      perwakilan_daerah: "BMH DKI Jakarta",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nama).toBe("Siti Aminah");
      expect(result.data.perwakilan_daerah).toBe("BMH DKI Jakarta");
    }
  });

  it("trim dan kompres spasi pada baris CSV", () => {
    const result = guestRowSchema.safeParse({
      nama: "  Siti   Aminah  ",
      perwakilan_daerah: "  BMH  DKI   Jakarta  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nama).toBe("Siti Aminah");
      expect(result.data.perwakilan_daerah).toBe("BMH DKI Jakarta");
    }
  });

  it("menolak nama kosong", () => {
    const result = guestRowSchema.safeParse({
      nama: "",
      perwakilan_daerah: "BMH Jawa Barat",
    });
    expect(result.success).toBe(false);
  });

  it("menolak perwakilan_daerah kosong", () => {
    const result = guestRowSchema.safeParse({
      nama: "Ahmad Dahlan",
      perwakilan_daerah: "",
    });
    expect(result.success).toBe(false);
  });

  it("menolak nama kurang dari 2 karakter setelah trim", () => {
    const result = guestRowSchema.safeParse({
      nama: " X ",
      perwakilan_daerah: "BMH Jawa Timur",
    });
    expect(result.success).toBe(false);
  });

  it("menerima dan menormalisasi jabatan pada guestRowSchema", () => {
    const result = guestRowSchema.safeParse({
      nama: "Fulan",
      perwakilan_daerah: "Pusat",
      jabatan: "  Ketua   Departemen  ",
      kategori: "departemen",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.jabatan).toBe("Ketua Departemen");
      expect(result.data.kategori).toBe("departemen");
    }
  });

  it("menerima dan menormalisasi jabatan pada attendanceSchema", () => {
    const result = attendanceSchema.safeParse({
      sessionId: 1,
      nama: "Fulan",
      perwakilanDaerah: "Pusat",
      jabatan: "Ketua Departemen",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.jabatan).toBe("Ketua Departemen");
    }
  });
});
