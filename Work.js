function getPendingTasksByRegion(region) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ISSUE_SHEET);
  const data = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[10] !== "OPEN") continue;
    if (row[5] !== region) continue;

    result.push({
      rowIndex: i + 1,
      ticket: row[0],
      name: row[2],
      email: row[3],
      phone: row[4],
      region: row[5],
      lat: row[6],
      lng: row[7],
      image: row[8],
      description: row[9]
    });
  }
  return result;
}

function formatTimestampGMT5_30(date) {
  const tzOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const localTime = new Date(date.getTime() + tzOffset * 60000);

  const pad = n => (n < 10 ? '0' + n : n);

  const day = pad(localTime.getUTCDate());
  const month = pad(localTime.getUTCMonth() + 1);
  const year = localTime.getUTCFullYear();
  const hours = pad(localTime.getUTCHours());
  const minutes = pad(localTime.getUTCMinutes());
  const seconds = pad(localTime.getUTCSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}


/* ================= COMPLETE TASK ================= */

function completeTask(payload) {
  if (!payload || !payload.ticket || !payload.image || !payload.imageName) {
    return "Invalid request";
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ISSUE_SHEET);
  const data = sheet.getDataRange().getValues();

  let targetRow = null;
  let citizenEmail = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.ticket) {
      targetRow = i + 1;
      citizenEmail = data[i][3];
      break;
    }
  }

  if (!targetRow) return "Ticket not found";

  // Upload completion image
  const imageUrl = uploadCompletionImage(payload.imageName, payload.image);

  // Update sheet
  sheet.getRange(targetRow, 11).setValue("DONE"); // Status
  sheet.getRange(targetRow, 12).setValue(imageUrl); // Completed Issue Link
  sheet.getRange(targetRow, 13).setValue(payload.workers); // Post by-
  sheet.getRange(targetRow, 14).setValue(formatTimestampGMT5_30(new Date())); // string timestamp
  sheet.getRange(targetRow, 15).setValue(payload.loggedInUser || "");


  // Notify citizen
  sendResolvedEmail(citizenEmail, payload.ticket);

  return "Task marked as DONE";
}

/* ================= DRIVE UPLOAD ================= */

function uploadCompletionImage(name, base64Data) {
  const folder = DriveApp.getFolderById(IMAGE_DONE_FOLDER);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    "image/jpeg",
    name
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/* ================= EMAIL ================= */

function sendResolvedEmail(email, ticketId) {
  const subject = "Waste Issue Resolved – Ticket ID: " + ticketId;

  const body =
    "Hello,\n\n" +
    "Your reported waste issue has been successfully resolved.\n\n" +
    "Ticket ID: " + ticketId + "\n\n" +
    "You may also check the current status, view the completion image, and see the contributors on our website using this Ticket ID.\n\n" +
    "Thank you for contributing to a cleaner and healthier city.\n\n" +
    "Regards,\n" +
    "Smart Waste Report Management App\n" +
    "Citizen Support Team";

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    name: "Smart Waste Report Management App"
  });
}


function getCompletedTasksByRegion(region) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ISSUE_SHEET);
  if (!sheet) return [];

  const data = sheet.getDataRange().getDisplayValues();
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const status = (row[10] || "").toString().trim().toUpperCase();
    if (status !== "DONE") continue;

    const rowRegion = (row[5] || "").toString().trim();
    if (region && region !== "" && rowRegion !== region) continue;

    const completion = row[13] || "";

    result.push({
      rowIndex: i + 1,
      ticket: row[0] || "",
      TimeStamp: row[1] || "",
      name: row[2] || "",
      email: row[3] || "",
      phone: row[4] || "",
      region: rowRegion,
      lat: row[6] || "",
      lng: row[7] || "",
      image: row[8] || "",
      description: row[9] || "",
      completedImage: row[11] || "",
      workers: row[12] || "",
      "Completion Timestamp": completion,
      CompletionTimestamp: completion,
      completionTimestamp: completion,
      Rating: row[15] || "",
      "Rating Description": row[16] || ""
    });
  }

  // 🔹 Latest entry first
  return result.reverse();
}
