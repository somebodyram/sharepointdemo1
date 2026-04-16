
const cds = require("@sap/cds");
const ExcelJS = require("exceljs");
const multer = require("multer");
const axios = require("axios");
const express = require("express");

const upload = multer();

cds.on("bootstrap", (app) => {

  // ✅ REQUIRED FOR /excel/process
  app.use(express.json());

  /* ================= Dummy API ================= */
  app.get("/api/player/:empId", (req, res) => {
    res.json({
      empId: Number(req.params.empId),
      rating: "A",
      experience: 15,
      country: "India"
    });
  });

  /* ================= 1. READ EXCEL (FILTERED) ================= */
  app.post("/excel/read", upload.single("file"), async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);

  const result = [];

  workbook.worksheets.forEach(ws => {
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const department = row.getCell(3).value;

      // ✅ STRICT MATCH ONLY
      if (String(department).trim().toLowerCase() === "all rounder") {
        result.push({
          empId: row.getCell(1).value,
          empName: row.getCell(2).value,
          department,
          sheet: ws.name,
          rowNumber // ✅ IMPORTANT for download later
        });
      }
    });
  });

  res.json(result);
});

  /* ================= 2. PROCESS EXCEL ================= */
  app.post("/excel/process", async (req, res) => {
  const rows = req.body; // ✅ rows from UI

  const enriched = [];

  for (const row of rows) {
    const apiRes = await axios.get(
      `http://localhost:4004/api/player/${row.empId}`
    );

    enriched.push({
      ...row,
      rating: apiRes.data.rating,
      experience: apiRes.data.experience,
      country: apiRes.data.country
    });
  }

  res.json(enriched);
});

  /* ================= 3. DOWNLOAD EXCEL ================= */
  app.post("/excel/download", upload.single("file"), async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);

  const enrichedRows = JSON.parse(req.body.data);

  enrichedRows.forEach(r => {
    const ws = workbook.getWorksheet(r.sheet);
    const row = ws.getRow(r.rowNumber);

    // ✅ Write API results
    row.getCell(4).value = "Rating";
    row.getCell(5).value = "Experience";
    row.getCell(6).value = "Country";

    row.getCell(4).value = r.rating;
    row.getCell(5).value = r.experience;
    row.getCell(6).value = r.country;
  });

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader("Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition",
    "attachment; filename=processed_excel.xlsx");

  res.send(buffer);
});

});