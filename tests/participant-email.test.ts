import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  buildParticipantEmails,
  nextParticipantEmail,
  participantFirstName,
} from "@/lib/participant-email";
import { parseCsv } from "@/lib/simple-csv";

const EXPECTED_LOCAL_PARTS = [
  "winanto", "khaeril", "mahfud", "rahman", "la", "rizky", "prawira", "syamsuddin", "aji", "abdul",
  "nurhadi", "abdul2", "gani", "sriyanto", "sugeng", "hairudin", "syukur", "muhammad", "suprianto",
  "muntamar", "tengku", "ismail", "fathur", "mochammad", "saiful", "soni", "mochammad2", "imam",
  "hendryanto", "catur", "syaiful", "ikhwanudin", "rohsyiandi", "nurhadiansyah", "khusnul", "rahmat",
  "wasmanto", "misbahul", "muhammad2", "dhiyaudin", "susanto", "asdar", "sahriadi", "robi", "armin", "marsono",
];

describe("participantFirstName", () => {
  it.each([
    ["Winanto", "winanto"],
    ["Mahfud Arobi, S.E.", "mahfud"],
    ["Muh. Khaeril", "khaeril"],
    ["Muh Gani Irwansyah, S.H., M.H.", "gani"],
    ["M Rizky As Ady", "rizky"],
    ["  Tengku Ilyas, S.E., M.M. ", "tengku"],
    ["La Samuri", "la"],
    ["Muhammad Rofiq, S.Sos., M.Si.", "muhammad"],
    ["Ádi Pútra", "adi"],
    ["Muh.", "muh"],
    ["", ""],
  ])("%s → %s", (name, expected) => {
    expect(participantFirstName(name)).toBe(expected);
  });
});

describe("nextParticipantEmail / buildParticipantEmails", () => {
  it("memberi nomor berurutan untuk nama depan yang kembar", () => {
    expect(buildParticipantEmails(["Abdul Wahid", "Abdul Wali", "Abdul Karim"])).toEqual([
      "abdul@bmh.or.id",
      "abdul2@bmh.or.id",
      "abdul3@bmh.or.id",
    ]);
  });

  it("menghindari email yang sudah ada (tanpa membedakan huruf besar/kecil)", () => {
    expect(buildParticipantEmails(["Abdul Wahid"], ["ABDUL@bmh.or.id"])).toEqual(["abdul2@bmh.or.id"]);
    expect(nextParticipantEmail("Siti", new Set(["siti@bmh.or.id", "siti2@bmh.or.id"]))).toBe("siti3@bmh.or.id");
  });

  it("nama tanpa huruf memakai cadangan 'peserta'", () => {
    expect(nextParticipantEmail("123", new Set())).toBe("123@bmh.or.id");
    expect(nextParticipantEmail("!!!", new Set())).toBe("peserta@bmh.or.id");
  });
});

describe("46 peserta pada docs/backup/guests_rows.csv", () => {
  const csvPath = path.join(__dirname, "..", "docs", "backup", "guests_rows.csv");
  const rows = parseCsv(fs.readFileSync(csvPath, "utf-8"));

  it("CSV terbaca benar (nama berkutip dengan koma tidak terpecah)", () => {
    expect(rows).toHaveLength(46);
    expect(rows.find((r) => r.nama === "Mahfud Arobi, S.E.")?.perwakilan_daerah).toBe("BMH Bali");
    expect(rows.find((r) => r.nama === "Muh Gani Irwansyah, S.H., M.H.")?.perwakilan_daerah).toBe("BMH Jawa Timur");
    expect(rows.every((r) => r.id && r.nama && r.perwakilan_daerah)).toBe(true);
  });

  it("menghasilkan 46 email unik persis sesuai rencana", () => {
    const emails = buildParticipantEmails(rows.map((r) => r.nama));
    expect(emails).toHaveLength(46);
    expect(new Set(emails).size).toBe(46);
    expect(emails.map((e) => e.replace("@bmh.or.id", ""))).toEqual(EXPECTED_LOCAL_PARTS);
    for (const e of emails) expect(e).toMatch(/^[a-z0-9]+@bmh\.or\.id$/);
  });
});
