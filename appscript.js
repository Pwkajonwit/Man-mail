/**
 * MAN Email Management - Google Apps Script Backend (V4 - Multiple Attachments)
 * เพิ่มระบบรองรับการแนบไฟล์หลายไฟล์ และบันทึกหลายไฟล์ลง Google Drive พร้อมส่ง
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; 
const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE'; 

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let sheetContacts = ss.getSheetByName('Contacts');
  if (!sheetContacts) {
    sheetContacts = ss.insertSheet('Contacts');
    sheetContacts.appendRow(['id', 'name', 'email', 'department', 'status']);
  }
  
  let sheetHistory = ss.getSheetByName('History');
  if (!sheetHistory) {
    sheetHistory = ss.insertSheet('History');
    sheetHistory.appendRow(['Date', 'To', 'Subject', 'Attachment_URL', 'Status']);
  }

  let sheetTemplates = ss.getSheetByName('Templates');
  if (!sheetTemplates) {
    sheetTemplates = ss.insertSheet('Templates');
    sheetTemplates.appendRow(['id', 'title', 'subject', 'body']);
    sheetTemplates.appendRow([new Date().getTime().toString(), 'รายงานประจำเดือน', 'สรุปรายงานประจำเดือน', '<p>สวัสดีครับ</p>']);
  }
}

function findRowIndexById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // skip header (1-based index)
  }
  return -1;
}

function doPost(e) {
  setupSheets();
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'sendEmail') {
      // payload ใหม่ส่งตัวแปรชื่อ files เป็น Array มาแทน
      const { to, subject, body, files } = data; 
      
      let attachmentBlobs = [];
      let fileUrls = [];

      // วนลูปอัปโหลดและเตรียมไฟล์ทั้งหมด
      if (files && Array.isArray(files) && files.length > 0) {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        
        files.forEach(f => {
          if (f.fileBase64 && f.fileName) {
            const decoded = Utilities.base64Decode(f.fileBase64);
            const blob = Utilities.newBlob(decoded, f.mimeType, f.fileName);
            attachmentBlobs.push(blob);
            
            const file = folder.createFile(blob);
            fileUrls.push(file.getUrl());
          }
        });
      }

      const emailOptions = { 
        htmlBody: body,
        name: 'Powetac' 
      };
      
      // ถ้ามีไฟล์แนบ ให้แนบไปทั้งหมด
      if (attachmentBlobs.length > 0) {
        emailOptions.attachments = attachmentBlobs;
      }
      
      // ส่งอีเมล
      GmailApp.sendEmail(to, subject, "Please view in HTML format.", emailOptions);

      // บันทึกประวัติ นำลิงก์ไฟล์มาต่อกันด้วยคอมม่า
      const allUrls = fileUrls.join(', ');
      const sheet = ss.getSheetByName('History');
      const timeStamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
      sheet.appendRow([timeStamp, to, subject, allUrls, 'Success']);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveRecord') {
      const { sheetName, record } = data;
      const sheet = ss.getSheetByName(sheetName);
      if (!record.id) record.id = new Date().getTime().toString();
      
      const headers = sheet.getDataRange().getValues()[0];
      const rowOutput = headers.map(h => record[h] !== undefined ? record[h] : '');
      
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
      const rowIndex = findRowIndexById(sheet, id);
      if (rowIndex > -1) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sheetDataToJson(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function doGet(e) {
  setupSheets();
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (action === 'getContacts') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: sheetDataToJson(ss.getSheetByName('Contacts')) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getHistory') {
    const history = sheetDataToJson(ss.getSheetByName('History'));
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: history.reverse() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getTemplates') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: sheetDataToJson(ss.getSheetByName('Templates')) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ message: 'API Running with Multi-Attachments!' }))
    .setMimeType(ContentService.MimeType.JSON);
}
