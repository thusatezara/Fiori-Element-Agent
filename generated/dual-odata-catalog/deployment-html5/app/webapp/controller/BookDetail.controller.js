sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/m/MessageBox"
], function (Controller, History, MessageBox) {
  "use strict";

  return Controller.extend("com.acme.dualcatalog.controller.BookDetail", {
    onInit: function () {
      this.getOwnerComponent().getRouter().getRoute("bookDetail").attachPatternMatched(this._onMatched, this);
    },

    _onMatched: function (oEvent) {
      var sId = oEvent.getParameter("arguments").bookId;
      if (!/^\d+$/.test(sId)) {
        this.getOwnerComponent().getRouter().navTo("notFound", {}, true);
        return;
      }
      this._bindElement("/Books(" + Number(sId) + ")");
    },

    _bindElement: function (sPath) {
      var oViewModel = this.getView().getModel("view");
      var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      oViewModel.setProperty("/detailBusy", true);
      this.getView().bindElement({
        model: "bookshop",
        path: sPath,
        parameters: {
          $select: "ID,title,descr,author_ID,genre_ID,stock,price,currency_code"
        },
        events: {
          dataReceived: function (oEvent) {
            oViewModel.setProperty("/detailBusy", false);
            if (oEvent.getParameter("error")) {
              MessageBox.error(oBundle.getText("bookDetailLoadError"));
            }
          }
        }
      });
    },

    onNavBack: function () {
      if (History.getInstance().getPreviousHash() !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("home", {}, true);
      }
    }
  });
});
