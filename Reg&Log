
// Temp storage for OTPs
var otpStore = {}

// ============ VALIDATIONS ============

// Email format check
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if email already exists
function checkEmail(email) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REG_SHEET);
  const data = sheet.getRange(2, 2, sheet.getLastRow(), 1).getValues().flat();
  return data.includes(email);
}

// Check username availability
function checkUsername(username) {
  const sheet = SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName(REG_SHEET);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return true; // no data yet

  const usernames = sheet
    .getRange(2, 5, lastRow - 1, 1) // COLUMN E = Username
    .getValues()
    .flat()
    .map(u => String(u).toLowerCase());

  return !usernames.includes(username.toLowerCase());
}


function sendOtp(email) {
  if (!isValidEmail(email)) {
    return { success: false, msg: "Invalid email format" };
  }

  if (checkEmail(email)) {
    return { success: false, msg: "Email already registered" };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Cache OTP for 10 minutes
  const cache = CacheService.getUserCache();
  cache.put(email, otp, 600); // 10 minutes

  const subject = "OTP Verification – Waste Reporting & Redressal System";

  const body =
    "Hello,\n\n" +
    "You have initiated worker registration for the Waste Reporting & Redressal System.\n\n" +
    "Your One-Time Password (OTP) is:\n\n" +
    otp + "\n\n" +
    "This OTP is valid for 10 minutes. Please do not share it with anyone.\n\n" +
    "If you did not initiate this request, you can safely ignore this email.\n\n" +
    "Regards,\n" +
    "Waste Reporting & Redressal System\n" +
    "Worker Registration Department & Team";

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    name: "Waste Reporting & Redressal System"
  });

  return { success: true, msg: "OTP sent successfully" };
}



function verifyOtp(email, otp) {
  const cache = CacheService.getUserCache();
  const storedOtp = cache.get(email);

  if (storedOtp && storedOtp === otp) {
    // OTP matched → clear it so it can't be reused
    cache.remove(email);
    return { success: true, msg: "User Authenticated" };
  }
  return { success: false, msg: "Invalid or Expired OTP" };
}

function createAccount(
  name,
  email,
  phone,
  region,
  username,
  password,
  idCardNumber,
  idCardImageBase64,
  idCardImageName
) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const regSheet = ss.getSheetByName(REG_SHEET);

  // FINAL safety check (cannot be bypassed)
  if (!checkUsername(username)) {
    return { success: false, msg: "Username already exists" };
  }

  const idCardImageUrl = uploadImageAndGetUrl(
    idCardImageName,
    idCardImageBase64,
    IMAGE_FOLDER_ID
  );

  regSheet.appendRow([
    name,
    email,
    phone,
    region,
    username,
    password,
    idCardNumber,
    idCardImageUrl,
    "PENDING"
  ]);

  return {
    success: true,
    msg: "Request sent. Await admin approval."
  };
}



function uploadImageAndGetUrl(filename, base64Data, folderId) {
  const folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    MimeType.PNG,
    filename
  );
  const file = folder.createFile(blob);
  return file.getUrl();
}




// Send OTP for Forgot Password
function forgotPassword(email) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(REG_SHEET);

  // Columns: Name | Email | Phone | Region | Username | Password
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();

  for (let i = 4; i < data.length; i++) {
    if (data[i][1] === email) { // Email column
      const username = data[i][4]; // Username column
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP for 10 minutes
      const cache = CacheService.getUserCache();
      cache.put(email, otp, 600);

      const subject = "Password Reset OTP – Waste Reporting & Redressal System";

      const body =
        "Hello " + username + ",\n\n" +
        "A password reset request was initiated for your worker account on the Waste Reporting & Redressal System.\n\n" +
        "Your One-Time Password (OTP) is:\n\n" +
        otp + "\n\n" +
        "This OTP is valid for 10 minutes. Please do not share it with anyone.\n\n" +
        "If you did not request a password reset, you can safely ignore this email.\n\n" +
        "Regards,\n" +
        "Waste Reporting & Redressal System\n" +
        "Worker Registration Department & Team";

      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body,
        name: "Waste Reporting & Redressal System"
      });

      return { success: true, msg: "OTP sent to registered email address" };
    }
  }

  return { success: false, msg: "No account found with this email" };
}


// Verify OTP for Forgot Password
function ForgotPassVerOTP(email, otpInput) {
  const cache = CacheService.getUserCache();
  const storedOtp = cache.get(email);

  if (storedOtp && storedOtp === otpInput) {
    cache.remove(email); // OTP matched → remove it
    return { success: true, msg: "OTP verified" };
  }
  return { success: false, msg: "Invalid or Expired OTP" };
}

// Change Password
function changePassword(email, newPass) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(REG_SHEET);
  if (!sheet) return { success: false, msg: "Sheet not found" };

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, msg: "No data found" };

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

  for (let i = 0; i < data.length; i++) {
    const rowEmail = String(data[i][1] || "").trim();

    if (rowEmail.toLowerCase() === email.toLowerCase()) {
      // Password column = 6
      sheet.getRange(i + 2, 6).setValue(newPass);
      return { success: true, msg: "Password changed successfully" };
    }
  }

  return { success: false, msg: "Account not found" };
}


/**
 * Verifies user login with username or email.
 * Returns { valid: true, username: "verifiedUsername" } on success.
 */
// Registration columns:
// A Name | B Email | C Phone | D Region | E Username | F Password

function loginUser(usernameOrEmail, password) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(REG_SHEET);
  if (!sheet) return { valid: false };

  const data = sheet.getDataRange().getValues();

  for (let i = 5; i < data.length; i++) {
    const row = data[i];

    const email    = String(row[1] || "").trim(); // B
    const region   = String(row[3] || "").trim(); // D
    const username = String(row[4] || "").trim(); // E
    const pass     = String(row[5] || "").trim(); // F
    const status   = String(row[8] || "").trim().toLowerCase(); // I

    const match =
      usernameOrEmail.toLowerCase() === email.toLowerCase() ||
      usernameOrEmail.toLowerCase() === username.toLowerCase();

    if (!match) continue;

    // Password mismatch
    if (password !== pass) {
      return { valid: false };
    }

    // Status handling
    if (status === "pending") {
      return {
        valid: false,
        status: "pending"
      };
    }

    if (status === "rejected") {
      return {
        valid: false,
        status: "rejected"
      };
    }

    if (status !== "approved") {
      return {
        valid: false,
        status: "unknown"
      };
    }

    // Approved user
    return {
      valid: true,
      username: username,
      region: region
    };
  }

  return { valid: false };
}


