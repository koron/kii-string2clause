(function(window) {
  "use strict";

  var data = {
    query: "",
    clause: "",
    error: "",
    debug: true,
  };
  var main = new Ractive({
    el: '#main-container',
    template: "#main-template",
    data: data,
  });

  main.observe('query', function(value) {
    if (value === "") {
      main.set({ clause: "", error: "" });
      return;
    }
    var r = Parser.parse(value);
    if (!r.status) {
      var err = Parsimmon.formatError(value, r);
      main.set({ clause: "", error: err });
      return;
    }
    var clause = JSON.stringify(r.value, null, 2);
    main.set({ clause: clause, error: "" });
  });

})(this);
