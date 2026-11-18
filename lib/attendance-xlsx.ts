import "server-only";
import ExcelJS from "exceljs";
import {
  buildSessionSummary,
  filterAttendances,
  getAbsentGuests,
  groupBySession,
  kategoriLabel,
  personKey,
  resolveSessionHari,
  safeSheetName,
  sessionLabel,
  sessionLocalOrder,
  sortByCheckIn,
  sortGuests,
  statusLabel,
  toWibExcelDate,
  type ExportAttendance,
  type ExportGuest,
  type ExportScope,
  type ExportSession,
} from "./attendance-export";

export interface BuildWorkbookInput {
  scope: ExportScope;
  sessions: ExportSession[];
  attendances: ExportAttendance[];
  guests: ExportGuest[];
  generatedAt?: Date;
}

const BRAND_GREEN = "FF0F5132";
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } } as const;
const DATE_FORMAT = "dd/mm/yyyy hh:mm:ss";

type Column = { header: string; key: string; width: number; numFmt?: string };

function addTableSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: Column[],
  rows: Record<string, unknown>[]
) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));
  for (const row of rows) ws.addRow(row);

  const header = ws.getRow(1);
  header.font = HEADER_FONT;
  header.alignment = { vertical: "middle" };
  header.height = 20;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return ws;
}

function hadirColumns(withSession: boolean): Column[] {
  return [
    { header: "No", key: "no", width: 6 },
    { header: "Waktu Presensi (WIB)", key: "waktu", width: 21, numFmt: DATE_FORMAT },
    ...(withSession
      ? [
          { header: "Hari", key: "hari", width: 7 },
          { header: "Sesi", key: "sesi", width: 30 },
        ]
      : []),
    { header: "Nama", key: "nama", width: 32 },
    { header: "Perwakilan Daerah", key: "perwakilan_daerah", width: 28 },
    { header: "Jabatan", key: "jabatan", width: 24 },
    { header: "Departemen", key: "departemen", width: 22 },
    { header: "Kategori", key: "kategori", width: 13 },
    { header: "Status", key: "status", width: 12 },
  ];
}

function hadirRows(attendances: ExportAttendance[], sessionMap: Map<number, ExportSession>) {
  return attendances.map((a, i) => {
    const session = sessionMap.get(a.session_id) ?? { id: a.session_id, nama: `Sesi ${a.session_id}` };
    return {
      no: i + 1,
      waktu: toWibExcelDate(a.checked_in_at) ?? a.checked_in_at,
      hari: resolveSessionHari(session),
      sesi: `Sesi ${sessionLocalOrder(session.id)}: ${session.nama}`,
      nama: a.nama,
      perwakilan_daerah: a.perwakilan_daerah,
      jabatan: a.jabatan || "-",
      departemen: a.departemen || "-",
      kategori: kategoriLabel(a.kategori),
      status: statusLabel(a.is_walk_in),
    };
  });
}

const belumHadirColumns: Column[] = [
  { header: "No", key: "no", width: 6 },
  { header: "Nama", key: "nama", width: 32 },
  { header: "Perwakilan Daerah", key: "perwakilan_daerah", width: 28 },
  { header: "Jabatan", key: "jabatan", width: 24 },
  { header: "Departemen", key: "departemen", width: 22 },
  { header: "Kategori", key: "kategori", width: 13 },
];

function guestRows(guests: ExportGuest[]) {
  return guests.map((g, i) => ({
    no: i + 1,
    nama: g.nama,
    perwakilan_daerah: g.perwakilan_daerah,
    jabatan: g.jabatan || "-",
    departemen: g.departemen || "-",
    kategori: kategoriLabel(g.kategori),
  }));
}

function addSummarySheet(
  wb: ExcelJS.Workbook,
  used: Set<string>,
  sessions: ExportSession[],
  grouped: Map<number, ExportAttendance[]>,
  guests: ExportGuest[],
  generatedAt: Date
) {
  const summaries = sessions.map((s) => buildSessionSummary(s, grouped.get(s.id) ?? [], guests));
  const ws = addTableSheet(
    wb,
    safeSheetName("Ringkasan", used),
    [
      { header: "Hari", key: "hari", width: 7 },
      { header: "Sesi", key: "sesi", width: 32 },
      { header: "Hadir", key: "hadir", width: 9 },
      { header: "Terdaftar", key: "terdaftar", width: 11 },
      { header: "Walk-in", key: "walkIn", width: 10 },
      { header: "Undangan", key: "undangan", width: 11 },
      { header: "Undangan Hadir", key: "undanganHadir", width: 15 },
      { header: "Belum Hadir", key: "belumHadir", width: 13 },
      { header: "% Kehadiran Undangan", key: "persen", width: 21, numFmt: "0.0%" },
    ],
    summaries.map((s) => ({
      hari: s.hari,
      sesi: `Sesi ${sessionLocalOrder(s.session.id)}: ${s.session.nama}`,
      hadir: s.hadir,
      terdaftar: s.terdaftar,
      walkIn: s.walkIn,
      undangan: s.undangan,
      undanganHadir: s.undanganHadir,
      belumHadir: s.belumHadir,
      persen: s.persenKehadiran / 100,
    }))
  );

  if (summaries.length > 1) {
    const total = ws.addRow({
      sesi: "Total",
      hadir: summaries.reduce((n, s) => n + s.hadir, 0),
      terdaftar: summaries.reduce((n, s) => n + s.terdaftar, 0),
      walkIn: summaries.reduce((n, s) => n + s.walkIn, 0),
    });
    total.font = { bold: true };
  }
  ws.addRow([]);
  ws.addRow(["Diekspor", toWibExcelDate(generatedAt.toISOString())]).getCell(2).numFmt = `${DATE_FORMAT} "WIB"`;
  ws.addRow(["Catatan", "Undangan = daftar tamu (guests). Belum hadir dicocokkan via ID tamu atau nama + daerah."]);
}

function addMatrixSheet(
  wb: ExcelJS.Workbook,
  used: Set<string>,
  sessions: ExportSession[],
  grouped: Map<number, ExportAttendance[]>,
  guests: ExportGuest[]
) {
  const presence = sessions.map((s) => {
    const list = grouped.get(s.id) ?? [];
    return {
      session: s,
      guestIds: new Set(list.map((a) => a.guest_id).filter(Boolean) as string[]),
      keys: new Set(list.map((a) => personKey(a.nama, a.perwakilan_daerah))),
    };
  });

  const columns: Column[] = [
    ...belumHadirColumns,
    ...sessions.map((s) => ({
      header: `H${resolveSessionHari(s)} S${sessionLocalOrder(s.id)} ${s.nama}`,
      key: `s${s.id}`,
      width: 14,
    })),
    { header: "Total Hadir", key: "total", width: 11 },
  ];

  const rows = sortGuests(guests).map((g, i) => {
    const key = personKey(g.nama, g.perwakilan_daerah);
    const row: Record<string, unknown> = guestRows([g])[0];
    row.no = i + 1;
    let total = 0;
    for (const p of presence) {
      const hadir = p.guestIds.has(g.id) || p.keys.has(key);
      if (hadir) total++;
      row[`s${p.session.id}`] = hadir ? "Hadir" : "-";
    }
    row.total = total;
    return row;
  });

  addTableSheet(wb, safeSheetName("Matriks Undangan", used), columns, rows);
}

export async function buildAttendanceWorkbook({
  scope,
  sessions,
  attendances,
  guests,
  generatedAt = new Date(),
}: BuildWorkbookInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Absensi BMH";
  wb.created = generatedAt;

  const used = new Set<string>();
  const sortedSessions = [...sessions].sort((a, b) => a.id - b.id);
  const sessionMap = new Map(sortedSessions.map((s) => [s.id, s]));

  if (scope.kind === "session") {
    const session = sessionMap.get(scope.sessionId);
    if (!session) throw new Error(`Sesi ${scope.sessionId} tidak ditemukan`);
    const list = sortByCheckIn(attendances.filter((a) => a.session_id === session.id));
    addSummarySheet(wb, used, [session], new Map([[session.id, list]]), guests, generatedAt);
    addTableSheet(wb, safeSheetName("Hadir", used), hadirColumns(false), hadirRows(list, sessionMap));
    addTableSheet(wb, safeSheetName("Belum Hadir", used), belumHadirColumns, guestRows(getAbsentGuests(guests, list)));
  } else if (scope.kind === "all") {
    const grouped = groupBySession(sortByCheckIn(attendances));
    addSummarySheet(wb, used, sortedSessions, grouped, guests, generatedAt);
    for (const s of sortedSessions) {
      addTableSheet(
        wb,
        safeSheetName(`H${resolveSessionHari(s)} S${sessionLocalOrder(s.id)} - ${s.nama}`, used),
        hadirColumns(false),
        hadirRows(grouped.get(s.id) ?? [], sessionMap)
      );
    }
    addMatrixSheet(wb, used, sortedSessions, grouped, guests);
  } else {
    const list = sortByCheckIn(filterAttendances(attendances, sortedSessions, scope.filter));
    const info = addTableSheet(
      wb,
      safeSheetName("Info Filter", used),
      [
        { header: "Filter", key: "k", width: 18 },
        { header: "Nilai", key: "v", width: 48 },
      ],
      [
        { k: "Hari", v: scope.filter.hari ? `Hari ${scope.filter.hari}` : "Semua Hari" },
        {
          k: "Sesi",
          v: scope.filter.sessionId
            ? sessionMap.has(scope.filter.sessionId)
              ? sessionLabel(sessionMap.get(scope.filter.sessionId)!)
              : `Sesi ${scope.filter.sessionId}`
            : "Semua Sesi",
        },
        { k: "Daerah", v: scope.filter.daerah || "Semua Daerah" },
        { k: "Pencarian", v: scope.filter.q?.trim() || "-" },
        { k: "Jumlah Baris", v: list.length },
        { k: "Diekspor", v: toWibExcelDate(generatedAt.toISOString()) },
      ]
    );
    info.getCell("B7").numFmt = `${DATE_FORMAT} "WIB"`;
    info.getCell("B7").alignment = { horizontal: "left" };
    addTableSheet(wb, safeSheetName("Hadir", used), hadirColumns(true), hadirRows(list, sessionMap));
  }

  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data as ArrayBuffer);
}
