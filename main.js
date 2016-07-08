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
    events: {
      clearQuery: function() {
        this.set('query', '');
      },
    },
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
