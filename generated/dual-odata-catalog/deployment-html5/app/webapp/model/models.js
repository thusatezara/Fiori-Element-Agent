sap.ui.define(["sap/ui/model/json/JSONModel"], function (JSONModel) {
  "use strict";

  return {
    createViewModel: function () {
      return new JSONModel({
        hasSearched: false,
        books: [],
        products: [],
        bookQuery: "",
        productQuery: "",
        booksBusy: false,
        productsBusy: false,
        detailBusy: false,
        bookCount: 0,
        productCount: 0
      });
    }
  };
});
