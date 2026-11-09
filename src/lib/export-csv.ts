/**
 * Utility to generate and trigger download of CSV files with UTF-8 BOM.
 * UTF-8 BOM (\uFEFF) ensures Microsoft Excel and spreadsheet tools render
 * Burmese font and special characters cleanly.
 */
export function downloadCSV(
  filename: string,
  rows: (string | number | null | undefined)[][]
) {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '""';
          const str = String(cell).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

