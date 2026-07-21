import ExcelJS from 'exceljs';

const COLUMNS = [
  { header: 'Sl.No', key: 'slNo', width: 8 },
  { header: 'Subject', key: 'subject', width: 28 },
  { header: 'Course Year (I/II/III/IV/V)', key: 'courseYear', width: 14 },
  { header: 'Term', key: 'term', width: 10 },
  { header: 'Course', key: 'course', width: 20 },
  { header: 'Text Books (3)', key: 'textBooks', width: 45 },
  { header: 'Reference Books (3)', key: 'referenceBooks', width: 45 },
  { header: 'Web Links', key: 'webLinks', width: 40 },
];

export async function buildWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('BOOKS');

  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  headerRow.height = 32;

  rows.forEach((row, i) => {
    const excelRow = sheet.addRow({
      slNo: i + 1,
      subject: row.subject || '',
      courseYear: row.courseYear || '',
      term: row.term || '',
      course: row.course || '',
      textBooks: row.textBooks || '',
      referenceBooks: row.referenceBooks || '',
      webLinks: row.webLinks || '',
    });
    excelRow.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });

  return workbook.xlsx.writeBuffer();
}
