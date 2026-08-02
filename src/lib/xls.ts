export function toXls(rows: Array<Record<string, unknown>>, sheetName = "Sheet1"): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v == null) return "";
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };
  const header = keys
    .map((k) => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${esc(k)}</Data></Cell>`)
    .join("");
  const body = rows
    .map((r) =>
      [
        "<Row>",
        keys
          .map((k) => {
            const v = r[k];
            const isNum = typeof v === "number";
            return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${
              isNum ? v : esc(v)
            }</Data></Cell>`;
          })
          .join(""),
        "</Row>",
      ].join(""),
    )
    .join("");
  return [
    '<?xml version="1.0"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    '<Styles><Style ss:ID="hdr"><Font ss:Bold="1"/></Style></Styles>',
    `<Worksheet ss:Name="${esc(sheetName)}"><Table><Row>${header}</Row>${body}</Table></Worksheet>`,
    "</Workbook>",
  ].join("");
}

export function downloadXls(
  filename: string,
  rows: Array<Record<string, unknown>>,
  sheetName?: string,
) {
  const xml = toXls(rows, sheetName);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
