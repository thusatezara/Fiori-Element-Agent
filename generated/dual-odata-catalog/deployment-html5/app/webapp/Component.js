sap.ui.define([
  "sap/ui/core/UIComponent",
  "com/acme/dualcatalog/model/models"
], function (UIComponent, models) {
  "use strict";

  return UIComponent.extend("com.acme.dualcatalog.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.setModel(models.createViewModel(), "view");
      this.getRouter().initialize();
    }
  });
});
