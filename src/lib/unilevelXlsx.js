/**
 * Formatted XLSX export for the admin Unilevel Points Entry History: a styled
 * workbook with a Summary sheet (account + grand total + an embedded "Top sources"
 * bar chart) and an Entries sheet (every repurchase entry that fed the account's
 * points-to-upline). Clean column widths, filled headers, frozen header row, integer
 * point formats — mirrors lib/pairingXlsx.js so the two exports feel identical.
 *
 * exceljs is heavy, so it's dynamically imported inside exportUnilevelXlsx — it only
 * loads when admin actually exports, keeping the Unilevel viewer route light.
 */
const GOLD = 'FFD4AF37';
const HEADER_BG = 'FF1F2937';
const HEADER_FG = 'FFF4D675';
const int = '#,##0';

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_FG }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } };
  });
}

// Vanilla-canvas horizontal bar chart of the top point sources → PNG (no chart lib).
function drawSourceChart(sources) {
  const w = 620; const h = Math.max(180, 70 + sources.length * 40);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1f2937'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'left';
  ctx.fillText('Top Sources — Points Passed to Upline', 16, 26);

  const labelW = 150; const x0 = labelW + 8; const valW = 90;
  const chartW = w - x0 - valW;
  const max = Math.max(1, ...sources.map((s) => Number(s.points || 0)));
  const barH = 24; const gap = 16; const y0 = 48;

  sources.forEach((s, i) => {
    const y = y0 + i * (barH + gap);
    const bw = Math.max(2, (Number(s.points || 0) / max) * chartW);
    ctx.fillStyle = '#374151'; ctx.font = '12px Arial'; ctx.textAlign = 'left';
    ctx.fillText(String(s.label || '').slice(0, 22), 8, y + barH - 7);
    ctx.fillStyle = '#D4AF37'; ctx.fillRect(x0, y, bw, barH);
    ctx.fillStyle = '#111827'; ctx.font = 'bold 12px Arial';
    ctx.fillText(Number(s.points || 0).toLocaleString('en-US'), x0 + bw + 8, y + barH - 7);
  });
  return canvas.toDataURL('image/png');
}

function triggerDownload(buffer, filename) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {object} p { account: { name, username }, totalPoints, total, rows }
 *   rows: [{ date, fullName, username, depth, productType, productName, points }]
 */
export async function exportUnilevelXlsx(p) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NOGATU Alliance';
  wb.created = new Date();

  const rows = Array.isArray(p.rows) ? p.rows : [];

  // Top sources (aggregate by member) for the summary chart.
  const bySource = new Map();
  for (const r of rows) {
    const key = r.username || `uid ${r.sourceUid}`;
    const label = r.fullName || r.username || key;
    const prev = bySource.get(key) || { label, points: 0 };
    prev.points += Number(r.points || 0);
    bySource.set(key, prev);
  }
  const topSources = [...bySource.values()].sort((a, b) => b.points - a.points).slice(0, 10);

  // ── Summary ──
  const s = wb.addWorksheet('Summary', { properties: { defaultColWidth: 22 } });
  s.mergeCells('A1:C1');
  s.getCell('A1').value = `Unilevel Points Entry History — ${p.account?.name || p.account?.username || 'Account'}`;
  s.getCell('A1').font = { bold: true, size: 15, color: { argb: GOLD } };
  s.getCell('A3').value = 'Account';
  s.getCell('B3').value = `${p.account?.name || ''}${p.account?.username ? ` (@${p.account.username})` : ''}`.trim();
  s.getCell('A4').value = 'Total points passed to upline';
  s.getCell('B4').value = Number(p.totalPoints || 0); s.getCell('B4').numFmt = int;
  s.getCell('A5').value = 'Total entries';
  s.getCell('B5').value = Number(p.total || rows.length); s.getCell('B5').numFmt = int;
  ['A3', 'A4', 'A5'].forEach((c) => { s.getCell(c).font = { bold: true }; });
  s.getColumn(1).width = 30; s.getColumn(2).width = 34;

  if (topSources.length > 0) {
    try {
      const imgId = wb.addImage({ base64: drawSourceChart(topSources), extension: 'png' });
      s.addImage(imgId, { tl: { col: 0, row: 6 }, ext: { width: 620, height: Math.max(180, 70 + topSources.length * 40) } });
    } catch { /* chart optional */ }
  }

  // ── Entries ──
  const e = wb.addWorksheet('Entries');
  e.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Source Member', key: 'name', width: 28 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Level', key: 'level', width: 8 },
    { header: 'Product', key: 'product', width: 26 },
    { header: 'Points', key: 'points', width: 12 },
  ];
  styleHeader(e.getRow(1));
  e.views = [{ state: 'frozen', ySplit: 1 }];
  rows.forEach((r) => {
    const row = e.addRow({
      date: r.date || '',
      name: r.fullName || '-',
      username: r.username || `uid ${r.sourceUid}`,
      level: `L${r.depth}`,
      product: r.productName || `Product ${r.productType}`,
      points: Number(r.points || 0),
    });
    row.getCell('points').numFmt = int;
  });

  const buf = await wb.xlsx.writeBuffer();
  triggerDownload(buf, `unilevel_points_${(p.account?.username || 'account')}_${Date.now()}.xlsx`);
}
