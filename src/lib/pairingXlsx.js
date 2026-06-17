/**
 * Formatted XLSX export for Pairing Reports (item ⑤): a styled workbook with a
 * Summary sheet (+ an embedded "Matched PV by tier" bar chart image), a Pairing
 * History sheet, and a Pairing Event Trace sheet. Clean column widths, bold/filled
 * headers, frozen header rows, peso/number formats — no overlapping.
 *
 * exceljs is heavy, so it's dynamically imported inside exportPairingXlsx — it only
 * loads when the member actually exports, keeping the Pairing Reports route light.
 */
const GOLD = 'FFD4AF37';
const HEADER_BG = 'FF1F2937';
const HEADER_FG = 'FFF4D675';

const peso = '#,##0.00';
const int = '#,##0';

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_FG }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } };
  });
}

// Vanilla-canvas horizontal bar chart → PNG data URL (no chart lib).
function drawTierChart(tierGroups) {
  const w = 600; const h = Math.max(180, 70 + tierGroups.length * 40);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1f2937'; ctx.font = 'bold 16px Arial';
  ctx.fillText('Matched PV by Package Tier', 16, 26);

  const labelW = 110; const x0 = labelW + 8; const valW = 90;
  const chartW = w - x0 - valW;
  const data = tierGroups.map((g) => ({ label: g.label, value: Number(g.totalPv || 0) }));
  const max = Math.max(1, ...data.map((d) => d.value));
  const barH = 24; const gap = 16; const y0 = 48;

  data.forEach((d, i) => {
    const y = y0 + i * (barH + gap);
    const bw = Math.max(2, (d.value / max) * chartW);
    ctx.fillStyle = '#374151'; ctx.font = '12px Arial'; ctx.textAlign = 'left';
    ctx.fillText(d.label, 8, y + barH - 7);
    ctx.fillStyle = '#D4AF37'; ctx.fillRect(x0, y, bw, barH);
    ctx.fillStyle = '#111827'; ctx.font = 'bold 12px Arial';
    ctx.fillText(`${d.value.toLocaleString('en-US')} PV`, x0 + bw + 8, y + barH - 7);
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
 * @param {object} p { username, summary, tierGroups, history, trace }
 *   summary: { lifetimeSmb, traceableSmb, legacySmb, lifetimePv }
 *   tierGroups: [{ label, count, totalPv, credited }]
 *   history: [{ pairedAt, left, right, matchedPoints, creditedIncome }]
 *   trace: [{ index, pairedAt, left, right, matchedPv, cumulativeMatchedPv, grossIncome, creditedIncome, blockedIncome, leftRemainingPv, rightRemainingPv, status }]
 */
export async function exportPairingXlsx(p) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NOGATU Alliance';
  wb.created = new Date();

  // ── Summary ──
  const s = wb.addWorksheet('Summary', { properties: { defaultColWidth: 22 } });
  s.mergeCells('A1:D1');
  s.getCell('A1').value = `Pairing (SMB) Report — ${p.username || 'Member'}`;
  s.getCell('A1').font = { bold: true, size: 16, color: { argb: GOLD } };
  s.getCell('A3').value = 'Lifetime SMB (₱)';
  s.getCell('B3').value = Number(p.summary?.lifetimeSmb || 0); s.getCell('B3').numFmt = peso;
  s.getCell('A4').value = 'Event-traceable (₱)';
  s.getCell('B4').value = Number(p.summary?.traceableSmb || 0); s.getCell('B4').numFmt = peso;
  s.getCell('A5').value = 'Verified legacy (₱)';
  s.getCell('B5').value = Number(p.summary?.legacySmb || 0); s.getCell('B5').numFmt = peso;
  s.getCell('A6').value = 'Lifetime matched PV';
  s.getCell('B6').value = Number(p.summary?.lifetimePv || 0); s.getCell('B6').numFmt = int;
  ['A3', 'A4', 'A5', 'A6'].forEach((c) => { s.getCell(c).font = { bold: true }; });

  const tierHeader = s.addRow([]); // spacer
  s.getCell(`A${s.rowCount + 1}`);
  const hdrRowIdx = 8;
  s.getRow(hdrRowIdx).values = ['Package Tier', 'Matches', 'Total Matched PV', 'Total Credited (₱)'];
  styleHeader(s.getRow(hdrRowIdx));
  (p.tierGroups || []).forEach((g) => {
    const r = s.addRow([g.label, Number(g.count || 0), Number(g.totalPv || 0), Number(g.credited || 0)]);
    r.getCell(3).numFmt = int; r.getCell(4).numFmt = peso;
  });
  s.getColumn(1).width = 22; s.getColumn(2).width = 12; s.getColumn(3).width = 18; s.getColumn(4).width = 20;

  if ((p.tierGroups || []).length > 0) {
    try {
      const imgId = wb.addImage({ base64: drawTierChart(p.tierGroups), extension: 'png' });
      const chartTop = hdrRowIdx + (p.tierGroups.length) + 2;
      s.addImage(imgId, { tl: { col: 0, row: chartTop }, ext: { width: 600, height: Math.max(180, 70 + p.tierGroups.length * 40) } });
    } catch { /* chart optional */ }
  }

  // ── Pairing History ──
  const h = wb.addWorksheet('Pairing History');
  h.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Left Source', key: 'left', width: 26 },
    { header: 'Right Source', key: 'right', width: 26 },
    { header: 'Matched PV', key: 'pv', width: 14 },
    { header: 'Credited (₱)', key: 'credited', width: 16 },
  ];
  styleHeader(h.getRow(1));
  h.views = [{ state: 'frozen', ySplit: 1 }];
  (p.history || []).forEach((row) => {
    const r = h.addRow({
      date: row.pairedAt ? new Date(row.pairedAt).toLocaleString('en-US') : '',
      left: row.left ? `${row.left.fullName || row.left.username || ''}` : (row.isLegacy ? 'Legacy import' : '-'),
      right: row.right ? `${row.right.fullName || row.right.username || ''}` : '-',
      pv: row.matchedPoints != null ? Math.round(Number(row.matchedPoints) / 250) : null,
      credited: Number(row.creditedIncome || 0),
    });
    r.getCell('pv').numFmt = int; r.getCell('credited').numFmt = peso;
  });

  // ── Pairing Event Trace ──
  const t = wb.addWorksheet('Pairing Event Trace');
  t.columns = [
    { header: '#', key: 'i', width: 6 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Left Source', key: 'left', width: 26 },
    { header: 'Right Source', key: 'right', width: 26 },
    { header: 'Matched PV', key: 'pv', width: 12 },
    { header: 'Running PV', key: 'run', width: 12 },
    { header: 'Gross (₱)', key: 'gross', width: 14 },
    { header: 'Credited (₱)', key: 'credited', width: 14 },
    { header: 'Blocked (₱)', key: 'blocked', width: 14 },
    { header: 'Left Remaining PV', key: 'lr', width: 16 },
    { header: 'Right Remaining PV', key: 'rr', width: 16 },
    { header: 'Status', key: 'status', width: 16 },
  ];
  styleHeader(t.getRow(1));
  t.views = [{ state: 'frozen', ySplit: 1 }];
  (p.trace || []).forEach((row, i) => {
    const r = t.addRow({
      i: i + 1,
      date: row.pairedAt ? new Date(row.pairedAt).toLocaleString('en-US') : '',
      left: row.left ? `${row.left.fullName || row.left.username || ''} (${row.left.packageLabel || '?'})` : '-',
      right: row.right ? `${row.right.fullName || row.right.username || ''} (${row.right.packageLabel || '?'})` : '-',
      pv: Math.round(Number(row.pairPoints || 0) / 250),
      run: Number(row.cumulativeMatchedPv || 0),
      gross: Number(row.grossIncome || 0),
      credited: Number(row.creditedIncome || 0),
      blocked: Number(row.blockedIncome || 0),
      lr: Math.round(Number(row.left?.remainingAfter || 0) / 250),
      rr: Math.round(Number(row.right?.remainingAfter || 0) / 250),
      status: row.status || '',
    });
    ['pv', 'run', 'lr', 'rr'].forEach((k) => { r.getCell(k).numFmt = int; });
    ['gross', 'credited', 'blocked'].forEach((k) => { r.getCell(k).numFmt = peso; });
  });

  const buf = await wb.xlsx.writeBuffer();
  triggerDownload(buf, `pairing_report_${(p.username || 'member')}_${Date.now()}.xlsx`);
}
