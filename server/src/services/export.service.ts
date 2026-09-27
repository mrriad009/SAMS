import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { getAttendanceReport, type ReportFilters } from './report.service.js';

type ExportRow = {
  studentName: string;
  roll: string;
  section: string;
  courseCode: string;
  courseName: string;
  present: number;
  total: number;
  percentage: number;
  defaulter: string;
};

function summarize(report: Awaited<ReturnType<typeof getAttendanceReport>>): ExportRow[] {
  const grouped = new Map<string, ExportRow>();

  for (const record of report.records) {
    const key = `${record.studentId}|${record.courseCode}`;
    const current = grouped.get(key) ?? {
      studentName: record.studentName,
      roll: record.studentId,
      section: record.section,
      courseCode: record.courseCode,
      courseName: record.courseName,
      present: 0,
      total: 0,
      percentage: 0,
      defaulter: 'No',
    };
    current.total += 1;
    if (record.status === 'present' || record.status === 'late') current.present += 1;
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map((row) => {
      const percentage = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
      return {
        ...row,
        percentage,
        defaulter: percentage < report.threshold ? 'Yes' : 'No',
      };
    })
    .sort((a, b) => a.roll.localeCompare(b.roll, undefined, { numeric: true }) || a.courseCode.localeCompare(b.courseCode));
}

export async function buildExcelReport(filters: ReportFilters) {
  const report = await getAttendanceReport(filters);
  const rows = summarize(report);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SAMS';

  const summary = workbook.addWorksheet('Summary');
  summary.columns = [
    { header: 'Student name', key: 'studentName', width: 28 },
    { header: 'Roll', key: 'roll', width: 16 },
    { header: 'Section', key: 'section', width: 12 },
    { header: 'Course', key: 'courseCode', width: 14 },
    { header: 'Course name', key: 'courseName', width: 32 },
    { header: 'Present', key: 'present', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Attendance %', key: 'percentage', width: 14 },
    { header: 'Defaulter', key: 'defaulter', width: 12 },
  ];
  summary.addRows(rows);
  summary.getRow(1).font = { bold: true };

  const raw = workbook.addWorksheet('Raw records');
  raw.columns = [
    { header: 'Date', key: 'sessionDate', width: 14 },
    { header: 'Student name', key: 'studentName', width: 28 },
    { header: 'Roll', key: 'roll', width: 16 },
    { header: 'Section', key: 'section', width: 12 },
    { header: 'Course', key: 'courseCode', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Source', key: 'markSource', width: 12 },
  ];
  raw.addRows(
    report.records.map((record) => ({
      sessionDate: record.sessionDate,
      studentName: record.studentName,
      roll: record.studentId,
      section: record.section,
      courseCode: record.courseCode,
      status: record.status,
      markSource: record.markSource,
    }))
  );
  raw.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildPdfReport(filters: ReportFilters) {
  const report = await getAttendanceReport(filters);
  const rows = summarize(report);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(16).text('Attendance report');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#444').text(`Threshold: ${report.threshold}%    Records: ${report.summary.totalRecords}`);
  if (filters.dateFrom || filters.dateTo) {
    doc.text(`Dates: ${filters.dateFrom || '…'} to ${filters.dateTo || '…'}`);
  }
  if (filters.section) doc.text(`Section: ${filters.section}`);
  if (filters.department) doc.text(`Department: ${filters.department}`);
  doc.moveDown();
  doc.fillColor('#000').fontSize(12).text('Student summary');
  doc.moveDown(0.4);
  doc.fontSize(9);

  const header = 'Roll          Name                      Course    %     Defaulter';
  doc.font('Courier').text(header);
  doc.moveDown(0.2);

  const visible = rows.slice(0, 400);
  for (const row of visible) {
    const line = [
      row.roll.padEnd(13).slice(0, 13),
      row.studentName.padEnd(26).slice(0, 26),
      row.courseCode.padEnd(10).slice(0, 10),
      String(row.percentage).padStart(3),
      '   ',
      row.defaulter,
    ].join(' ');
    doc.text(line);
  }

  if (rows.length > visible.length) {
    doc.moveDown();
    doc.font('Helvetica').text(`Showing ${visible.length} of ${rows.length} rows. Use the Excel export for the full set.`);
  }

  doc.moveDown();
  doc.font('Helvetica').fontSize(12).text(`Defaulters below ${report.threshold}%`);
  doc.fontSize(9).font('Courier');
  const defaulters = report.defaulters.slice(0, 80);
  if (defaulters.length === 0) {
    doc.font('Helvetica').text('None');
  } else {
    for (const student of defaulters) {
      doc.text(`${student.studentId}  ${student.name}  Sec ${student.section}  ${student.percentage}%`);
    }
  }

  doc.end();
  return done;
}
