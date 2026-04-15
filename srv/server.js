const cds = require("@sap/cds");
const ExcelJS = require("exceljs");
const multer = require("multer");

const upload = multer(); // in-memory storage

cds.on("bootstrap", (app) => {

  app.post("/upload/excel", upload.single("file"), async (req, res) => {
    try {
      console.log("=== EXCEL UPLOAD ENDPOINT HIT ===");

      // 1️⃣ Validate upload
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("File name:", req.file.originalname);
      console.log("File size:", req.file.size);

      // 2️⃣ Load workbook
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      console.log("Total sheets:", workbook.worksheetCount);

      // 3️⃣ Collect rows from ALL sheets
      const allMappedRows = [];

      workbook.worksheets.forEach((worksheet) => {
        console.log("Processing sheet:", worksheet.name);

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; // skip header

          const empId = row.getCell(1).value;
          const empName = row.getCell(2).value;
          const department = row.getCell(3).value;

          if (!empId && !empName && !department) return;

          // ✅ Filter condition: department = "all rounder"
          if (
            department &&
            String(department).trim().toLowerCase() === "all rounder"
          ) {
            allMappedRows.push({
              empId: Number(empId),
              empName: String(empName),
              department: String(department),
              sourceSheet: worksheet.name // ✅ helpful info
            });
          }
        });
      });

      console.log("Filtered rows across ALL sheets:", allMappedRows);

      // 4️⃣ Handle no-data case
      if (allMappedRows.length === 0) {
        console.log("No 'all rounder' data found in any sheet");
        return res.json([]);
      }

      // 5️⃣ Return result
      return res.json(allMappedRows);

    } catch (err) {
      console.error("Excel processing failed:", err);
      return res.status(500).json({ error: err.message });
    }
  });

});