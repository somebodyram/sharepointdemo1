sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, JSONModel) {
  "use strict";

  return Controller.extend(
    "sharepointdemo1.custompageapp.ext.view.Main",
    {

      /* =========================================================== */
      /* Lifecycle                                                   */
      /* =========================================================== */
      onInit: function () {
        // Holds data shown in the table
        const oExcelModel = new JSONModel([]);
        this.getView().setModel(oExcelModel, "excelModel");
      },

      /* =========================================================== */
      /* 1. READ EXCEL (STRICT 'all rounder')                        */
      /* =========================================================== */
      onReadExcel: function () {
        const oFile = this._getSelectedFile();
        if (!oFile) {
          MessageBox.warning("Please select an Excel file.");
          return;
        }

        const oFormData = new FormData();
        oFormData.append("file", oFile);

        fetch("/excel/read", {
          method: "POST",
          body: oFormData
        })
          .then(response => response.json())
          .then(data => {
            this.getView()
              .getModel("excelModel")
              .setData(data);

            MessageBox.success(
              "Read Excel completed. Rows: " + data.length
            );
          })
          .catch(err => {
            console.error(err);
            MessageBox.error("Failed to read Excel.");
          });
      },

      /* =========================================================== */
      /* 2. PROCESS EXCEL (USE UI DATA + DUMMY API)                  */
      /* =========================================================== */
      onProcessExcel: function () {
        const aCurrentData =
          this.getView().getModel("excelModel").getData();

        if (!aCurrentData || aCurrentData.length === 0) {
          MessageBox.warning(
            "No data to process. Please read Excel first."
          );
          return;
        }

        fetch("/excel/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aCurrentData)
        })
          .then(response => response.json())
          .then(data => {
            this.getView()
              .getModel("excelModel")
              .setData(data);

            MessageBox.success(
              "Process Excel completed. Rows: " + data.length
            );
          })
          .catch(err => {
            console.error(err);
            MessageBox.error("Failed to process Excel.");
          });
      },

      /* =========================================================== */
      /* 3. DOWNLOAD EXCEL (WRITE BACK ENRICHED DATA)                */
      /* =========================================================== */
      onDownloadExcel: function () {
        const oFile = this._getSelectedFile();
        if (!oFile) {
          MessageBox.warning("Please select an Excel file.");
          return;
        }

        const aEnrichedData =
          this.getView().getModel("excelModel").getData();

        if (!aEnrichedData || aEnrichedData.length === 0) {
          MessageBox.warning(
            "No processed data available to download."
          );
          return;
        }

        const oFormData = new FormData();
        oFormData.append("file", oFile);
        oFormData.append("data", JSON.stringify(aEnrichedData));

        fetch("/excel/download", {
          method: "POST",
          body: oFormData
        })
          .then(response => response.blob())
          .then(blob => {
            const sUrl = window.URL.createObjectURL(blob);
            const oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "processed_excel.xlsx";
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
            window.URL.revokeObjectURL(sUrl);
          })
          .catch(err => {
            console.error(err);
            MessageBox.error("Failed to download Excel.");
          });
      },

      /* =========================================================== */
      /* Helper: Get selected file from FileUploader                 */
      /* =========================================================== */
      _getSelectedFile: function () {
        const oUploader = this.byId("excelUploader");
        if (!oUploader) {
          return null;
        }

        const oDomRef = oUploader.getDomRef();
        if (!oDomRef) {
          return null;
        }

        const oInput = oDomRef.querySelector("input[type='file']");
        if (!oInput || !oInput.files || oInput.files.length === 0) {
          return null;
        }

        return oInput.files[0];
      }

    }
  );
});