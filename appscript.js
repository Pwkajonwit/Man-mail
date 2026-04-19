/**
 * MAN Email Management - Google Apps Script Backend
 * 
 * วิธีการติดตั้ง:
 * 1. เปิด Google Sheets เล่มที่จะใช้เก็บข้อมูล
 * 2. สร้างชีตชื่อ 'Contacts' (ใส่หัวตารางเช่น id, name, email, department, status)
 * 3. สร้างชีตชื่อ 'Email_Logs'
 * 4. ไปที่เมนู ส่วนขยาย (Extensions) > Apps Script
 * 5. คัดลอกโค้ดนี้ไปวางทับในไฟล์ Code.gs ทั้งหมด
 * 6. แก้ไขค่า SPREADSHEET_ID และ FOLDER_ID ด้านล่างให้ถูกต้อง
 * 7. กด "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 8. เลือกประเภท "เว็บแอป" (Web App)
 * 9. สิทธิ์การเข้าถึง (Execute as): "ฉัน" (Me)
 * 10. ผู้มีสิทธิ์เข้าถึง (Who has access): "ทุกคน" (Anyone)
 * 11. กด Deploy แล้วนำ Web App URL (ที่ขึ้นต้นด้วย https://script.google.com/macros/...) ไปใส่ในโค้ด Next.js ของเรา
 */

const SPREADSHEET_ID = '1ITKNmyro78pxw-LOGA9jmRkI_z81sMhVVr3TKF8CaNg'; // ใส่ ID ของ Google Sheets (ดูจาก URL)
const FOLDER_ID = '1jRLbKi_nl9iw9HKuzlcYDhgowpuG0lJY'; // ใส่ ID ของ FOLDER ใน Google Drive ที่จะเก็บไฟล์แนบ

const CONTACT_HEADERS = ['id', 'name', 'email', 'department', 'status'];
const HISTORY_HEADERS = ['Date', 'To', 'Subject', 'Attachment_URL', 'Status', 'CC', 'Body_HTML'];
const TEMPLATE_HEADERS = [
  'id',
  'title',
  'subject',
  'body',
  'signature_name',
  'signature_title',
  'signature_phone',
  'signature_email',
  'signature_company',
  'image_url',
];
const SIGNATURE_HEADERS = [
  'id',
  'name',
  'title',
  'company',
  'phone',
  'email',
  'image_url',
];

const MAX_ATTACHMENT_TOTAL_BYTES = 18 * 1024 * 1024;
const BLOCKED_ATTACHMENT_EXTENSIONS = [
  'ade',
  'adp',
  'apk',
  'appx',
  'bat',
  'cab',
  'chm',
  'cmd',
  'com',
  'cpl',
  'diagcab',
  'diagcfg',
  'diagpkg',
  'dll',
  'dmg',
  'ex',
  'ex_',
  'exe',
  'hta',
  'img',
  'ins',
  'iso',
  'isp',
  'jar',
  'jnlp',
  'js',
  'jse',
  'lib',
  'lnk',
  'mde',
  'msc',
  'msi',
  'msix',
  'msp',
  'mst',
  'nsh',
  'pif',
  'ps1',
  'scr',
  'sct',
  'shb',
  'sys',
  'vb',
  'vbe',
  'vbs',
  'vxd',
  'wsc',
  'wsf',
  'wsh',
];

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return Math.ceil(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function getFileExtension(fileName) {
  const dotIndex = String(fileName).lastIndexOf('.');
  if (dotIndex < 0) return '';
  return String(fileName).slice(dotIndex + 1).toLowerCase();
}

function isBlockedAttachmentName(fileName) {
  return BLOCKED_ATTACHMENT_EXTENSIONS.indexOf(getFileExtension(fileName)) > -1;
}

function normalizeBase64(value) {
  const text = String(value || '');
  const commaIndex = text.indexOf(',');
  return commaIndex > -1 ? text.slice(commaIndex + 1) : text;
}

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  getOrCreateSheet(ss, 'Contacts', CONTACT_HEADERS);
  getOrCreateSheet(ss, 'History', HISTORY_HEADERS);
  getOrCreateSheet(ss, 'Signatures', SIGNATURE_HEADERS);
  const templateSheet = getOrCreateSheet(ss, 'Templates', TEMPLATE_HEADERS);

  if (templateSheet.getLastRow() === 1) {
    const defaultTemplate = {
      id: String(new Date().getTime()),
      title: 'Monthly Report',
      subject: 'Monthly business update',
      body: 'Hello,\n\nPlease find the latest monthly update attached.\n\nThank you.',
      signature_name: 'Admin User',
      signature_title: 'Operations Team',
      signature_phone: '',
      signature_email: '',
      signature_company: 'Email',
      image_url: '',
    };

    templateSheet.appendRow(recordToRow(TEMPLATE_HEADERS, defaultTemplate));
  }
}

function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  ensureSheetHeaders(sheet, headers);
  return sheet;
}

function ensureSheetHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getValues()[0]
    .map((value) => String(value).trim());

  const missingHeaders = headers.filter((header) => !currentHeaders.includes(header));
  if (missingHeaders.length === 0) return;

  sheet
    .getRange(1, sheet.getLastColumn() + 1, 1, missingHeaders.length)
    .setValues([missingHeaders]);
}

function recordToRow(headers, record) {
  return headers.map((header) => (record[header] !== undefined ? record[header] : ''));
}

function findRowIndexById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function sheetDataToJson(sheet) {
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index];
    });
    return entry;
  });
}

function doPost(e) {
  setupSheets();

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'sendEmail') {
      const { to, cc, subject, body, plainTextBody, files } = data;

      let attachmentBlobs = [];
      let fileUrls = [];

      if (files && Array.isArray(files) && files.length > 0) {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        let totalAttachmentBytes = 0;

        files.forEach((fileItem) => {
          if (!fileItem.fileName) {
            throw new Error('Attachment is missing a file name.');
          }

          if (isBlockedAttachmentName(fileItem.fileName)) {
            throw new Error('Gmail blocks this attachment type: ' + fileItem.fileName);
          }

          if (!fileItem.fileBase64) {
            throw new Error('Attachment is missing file data: ' + fileItem.fileName);
          }

          const decoded = Utilities.base64Decode(normalizeBase64(fileItem.fileBase64));
          totalAttachmentBytes += decoded.length;
          if (totalAttachmentBytes > MAX_ATTACHMENT_TOTAL_BYTES) {
            throw new Error(
              'Attachments are too large (' +
                formatBytes(totalAttachmentBytes) +
                '). Limit is ' +
                formatBytes(MAX_ATTACHMENT_TOTAL_BYTES) +
                '.'
            );
          }

          const blob = Utilities.newBlob(
            decoded,
            fileItem.mimeType || 'application/octet-stream',
            fileItem.fileName
          );
          attachmentBlobs.push(blob);

          const savedFile = folder.createFile(blob);
          fileUrls.push(savedFile.getUrl());
        });
      }

      const emailOptions = {
        htmlBody: body,
        name: 'บริษัท พาวเวอร์เทค เอนจิเนียริ่ง จำกัด',
      };

      if (cc && String(cc).trim()) {
        emailOptions.cc = String(cc).trim();
      }

      if (attachmentBlobs.length > 0) {
        emailOptions.attachments = attachmentBlobs;
      }

      GmailApp.sendEmail(
        to,
        subject,
        plainTextBody || 'Please view this email in HTML format.',
        emailOptions
      );

      const historySheet = ss.getSheetByName('History');
      const timeStamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
      const historyHeaders = historySheet
        .getRange(1, 1, 1, Math.max(historySheet.getLastColumn(), 1))
        .getValues()[0];

      historySheet.appendRow(
        recordToRow(historyHeaders, {
          Date: timeStamp,
          To: to,
          Subject: subject,
          Attachment_URL: fileUrls.join(', '),
          Status: 'Success',
          CC: cc || '',
          Body_HTML: body || '',
        })
      );

      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveRecord') {
      const { sheetName, record } = data;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

      if (!record.id) {
        record.id = String(new Date().getTime());
      }

      const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
      const rowOutput = recordToRow(headers, record);
      const rowIndex = findRowIndexById(sheet, record.id);

      if (rowIndex > -1) {
        sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowOutput]);
      } else {
        sheet.appendRow(rowOutput);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deleteRecord') {
      const { sheetName, id } = data;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

      const rowIndex = findRowIndexById(sheet, id);
      if (rowIndex > -1) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unsupported action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  setupSheets();

  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (action === 'getContacts') {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', data: sheetDataToJson(ss.getSheetByName('Contacts')) })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getHistory') {
    const history = sheetDataToJson(ss.getSheetByName('History'));
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: history.reverse() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getTemplates') {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', data: sheetDataToJson(ss.getSheetByName('Templates')) })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getSignatures') {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', data: sheetDataToJson(ss.getSheetByName('Signatures')) })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ message: 'API Running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
