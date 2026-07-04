/**
 * Helper utilities for exporting reports in CSV, Excel, and triggering Print PDF views
 */

// Add UTF-8 BOM so Excel reads Thai characters correctly
const UTF8_BOM = '\uFEFF';

export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const content = [
    headers.join(','),
    ...rows.map(row => row.map(val => {
      // Escape commas and double quotes
      const cleanVal = (val || '').replace(/"/g, '""');
      return cleanVal.includes(',') || cleanVal.includes('"') || cleanVal.includes('\n')
        ? `"${cleanVal}"`
        : cleanVal;
    }).join(','))
  ].join('\n');

  const blob = new Blob([UTF8_BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, headers: string[], rows: string[][]) {
  // Excel can open tab-separated values or BOM-prefixed CSV flawlessly
  exportToCSV(filename, headers, rows);
}

export function triggerPrint(elementId: string) {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;

  const originalContent = document.body.innerHTML;
  
  // Create a clean layout for printing
  document.body.innerHTML = `
    <html>
      <head>
        <title>ทรัพย์วราค้าข้าว - รายงาน</title>
        <style>
          body {
            font-family: 'Inter', 'Sarabun', sans-serif;
            color: #1a1a1a;
            padding: 20px;
            background: white;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #15803d;
          }
          .meta {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
          }
          .total-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 10px;
            border-radius: 4px;
            margin-top: 15px;
            font-size: 13px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `;
  
  window.print();
  
  // Restore original content
  document.body.innerHTML = originalContent;
  // Reload window to bind original events
  window.location.reload();
}
