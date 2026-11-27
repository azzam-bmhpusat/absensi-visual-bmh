import "server-only";
import ExcelJS from "exceljs";
import { addTableSheet } from "./attendance-xlsx";
import { safeSheetName, toWibExcelDate } from "./attendance-export";
import { USER_EXPORT_COLUMNS, userExportRows, userExportScopeInfo, type UserExportScope } from "./user-export";
import type { UserRow } from "./user-row";

export { buildUserExportFilename, type UserExportScope } from "./user-export";

const DATE_FORMAT = "dd/mm/yyyy hh:mm";

/** `users` harus sudah difilter sesuai scope. */
export async function buildUserWorkbook(
  scope: UserExportScope,
  users: UserRow[],
  generatedAt: Date = new Date()
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Absensi BMH";
  wb.created = generatedAt;
  const used = new Set<string>();

  addTableSheet(wb, safeSheetName("User", used), [...USER_EXPORT_COLUMNS], userExportRows(users));

  const info = addTableSheet(
    wb,
    safeSheetName("Info Ekspor", used),
    [
      { header: "Keterangan", key: "k", width: 18 },
      { header: "Nilai", key: "v", width: 48 },
    ],
    [
      ...userExportScopeInfo(scope),
      { k: "Jumlah User", v: users.length },
      { k: "Diekspor", v: toWibExcelDate(generatedAt.toISOString()) },
    ]
  );
  const stamp = info.getCell(`B${info.rowCount}`);
  stamp.numFmt = `${DATE_FORMAT} "WIB"`;
  stamp.alignment = { horizontal: "left" };

  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data as ArrayBuffer);
}
