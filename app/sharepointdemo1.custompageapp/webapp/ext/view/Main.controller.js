sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, JSONModel) {
  "use strict";

  return Controller.extend(
    "sharepointdemo1.custompageapp.ext.view.Main",
    {

      onInit: function () {
        const oModel = new JSONModel([]);
        this.getView().setModel(oModel, "excelModel");
      },

      onReadExcelPress: function () {
        const oFileUploader = this.byId("excelUploader");
        const oDomRef = oFileUploader.getDomRef();

        if (!oDomRef) {
          MessageBox.error("FileUploader DOM not ready");
          return;
        }

        const oFileInput = oDomRef.querySelector("input[type='file']");
        if (!oFileInput || oFileInput.files.length === 0) {
          MessageBox.warning("Please select an Excel file.");
          return;
        }

        const oFile = oFileInput.files[0];
        console.log("Selected file:", oFile.name, oFile.size);

        const oFormData = new FormData();
        oFormData.append("file", oFile);

        fetch("/upload/excel", {
          method: "POST",
          body: oFormData
        })
          .then((response) => response.json())
          .then((data) => {
            this.getView()
              .getModel("excelModel")
              .setData(data);

            MessageBox.success(
              "Excel processed successfully. Rows read: " + data.length
            );

            console.log("Excel data from backend:", data);
          })
          .catch((err) => {
            console.error(err);
            MessageBox.error("Failed to process Excel.");
          });
      }

    }
  );
});