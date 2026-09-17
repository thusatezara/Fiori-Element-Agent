sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, MessageBox) {
  "use strict";

  return Controller.extend("com.acme.dualcatalog.controller.Home", {
    onExecute: function () {
      var oViewModel = this.getView().getModel("view");
      oViewModel.setProperty("/hasSearched", true);
      this._loadBooks(oViewModel.getProperty("/bookQuery"));
      this._loadProducts(oViewModel.getProperty("/productQuery"));
    },

    onBookPress: function (oEvent) {
      var iBookId = oEvent.getSource().getBindingContext("view").getProperty("ID");
      this.getOwnerComponent().getRouter().navTo("bookDetail", { bookId: iBookId });
    },

    onProductPress: function (oEvent) {
      var iProductId = oEvent.getSource().getBindingContext("view").getProperty("ProductID");
      this.getOwnerComponent().getRouter().navTo("productDetail", { productId: iProductId });
    },

    _titleFilter: function (sQuery) {
      return sQuery ? [new Filter("title", FilterOperator.Contains, sQuery)] : [];
    },

    _productFilter: function (sQuery) {
      return sQuery ? [new Filter("ProductName", FilterOperator.Contains, sQuery)] : [];
    },

    _loadBooks: function (sQuery) {
      var oViewModel = this.getView().getModel("view");
      var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      var oListBinding = this.getOwnerComponent().getModel("bookshop").bindList(
        "/Books",
        undefined,
        undefined,
        this._titleFilter(sQuery),
        { $select: "ID,title,author_ID,stock,price,currency_code" }
      );
      oViewModel.setProperty("/booksBusy", true);
      oListBinding.requestContexts(0, 100).then(function (aContexts) {
        var aBooks = aContexts.map(function (oContext) { return oContext.getObject(); });
        oViewModel.setProperty("/books", aBooks);
        oViewModel.setProperty("/bookCount", aBooks.length);
      }).catch(function () {
        oViewModel.setProperty("/books", []);
        oViewModel.setProperty("/bookCount", 0);
        MessageBox.error(oBundle.getText("booksLoadError"));
      }).finally(function () {
        oViewModel.setProperty("/booksBusy", false);
      });
    },

    _loadProducts: function (sQuery) {
      var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      var oViewModel = this.getView().getModel("view");
      oViewModel.setProperty("/productsBusy", true);
      this.getOwnerComponent().getModel("northwind").read("/Products", {
        filters: this._productFilter(sQuery),
        urlParameters: {
          "$select": "ProductID,ProductName,CategoryID,UnitPrice,UnitsInStock,QuantityPerUnit,Discontinued",
          "$top": "100"
        },
        success: function (oData) {
          var aProducts = oData.results || [];
          oViewModel.setProperty("/products", aProducts);
          oViewModel.setProperty("/productCount", aProducts.length);
          oViewModel.setProperty("/productsBusy", false);
        },
        error: function () {
          oViewModel.setProperty("/products", []);
          oViewModel.setProperty("/productCount", 0);
          oViewModel.setProperty("/productsBusy", false);
          MessageBox.error(oBundle.getText("productsLoadError"));
        }
      });
    }
  });
});
