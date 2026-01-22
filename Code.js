function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle("Waste Reporting & Redressal System")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// === Load other pages ===
function loadPage(pageName) {
  const template = HtmlService.createTemplateFromFile(pageName);
  return template.evaluate().getContent();
}

// === CONSTANTS ===
// === For Security purposes, ids are not disclosed (IMPORTANT)
const SHEET_ID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // spreadsheet id to be pasted here
const REG_SHEET = "xxxxxxxxxx"; // name of the sheet need to be pasted here which takes Registration details of Workers
const ISSUE_SHEET = "xxxxx"; // name of the sheet need to be pasted here where issues/task appended
const IMAGE_FOLDER_ID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; //drive link id to be pasted here for task pending
const IMAGE_DONE_FOLDER = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; //drive link id to be pasted here for task completed
const ID_PROOF_FOLDER = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";



function parseCustomTimestamp(tsString) {
  // Guard clause to ensure valid string input
  if (!tsString || typeof tsString !== 'string' || !tsString.includes('/')) {
    return null;
  }
  
  try {
    const parts = tsString.split(' ');
    const dateParts = parts[0].split('/'); // [DD, MM, YYYY]
    const timeParts = parts[1].split(':'); // [HH, MM, SS]

    // Construct Date: new Date(year, monthIndex, day, hours, minutes, seconds)
    // Month is 0-indexed (Jan = 0)
    return new Date(
      parseInt(dateParts[2], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[0], 10),
      parseInt(timeParts[0], 10),
      parseInt(timeParts[1], 10),
      parseInt(timeParts[2], 10)
    );
  } catch (e) {
    return null;
  }
}

/**
 * Fetches dashboard statistics.
 * Column Index: [1] Assigned Timestamp, [10] Status, [13] Completion Timestamp
 */
function getDashboardStats() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(ISSUE_SHEET);
    
    if (!sheet) return { reported: 0, cleared: 0, pending: 0, avgTime: "0" };

    const data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return { reported: 0, cleared: 0, pending: 0, avgTime: "0" };

    let totalReported = 0;
    let totalCleared = 0;
    let totalPending = 0;
    let totalResolutionTimeMs = 0;
    let resolvedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = String(row[10]).trim().toUpperCase();
      
      totalReported++;

      if (status === "DONE") {
        totalCleared++;
        
        const startDate = parseCustomTimestamp(row[1]);
        const endDate = parseCustomTimestamp(row[13]);

        if (startDate && endDate) {
          const startTime = startDate.getTime();
          const endTime = endDate.getTime();

          // Only calculate if the dates are logical
          if (endTime > startTime) {
            totalResolutionTimeMs += (endTime - startTime);
            resolvedCount++;
          }
        }
      } else {
        totalPending++;
      }
    }

    let avgHours = "0";
    if (resolvedCount > 0) {
      const avgMs = totalResolutionTimeMs / resolvedCount;
      // ms to hours conversion
      avgHours = (avgMs / (1000 * 60 * 60)).toFixed(1);
    }

    return {
      reported: totalReported,
      cleared: totalCleared,
      pending: totalPending,
      avgTime: avgHours
    };

  } catch (e) {
    return { reported: "!", cleared: "!", pending: "!", avgTime: "0" };
  }
}
