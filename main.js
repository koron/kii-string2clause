(function(window) {
  "use strict";

  var data = {
    query: "",
    clause: "",
    error: "",
    debug: true,
    examples: [
      'name = "abc"',
      'age = 123',
      'name PREFIX "abc"',
      '20 <= age < 30',
      'name PREFIX "John" & age = 30',
      'X=10 AND Y=20 OR Z=30',
      'X=10 & Y=20 | Z=30',
      '(X=10 & Y=20) | Z=30',
      'NOT X=10',
      '!X=10',
      'X!=10',
      'loc IN 10 FROM (123 456)',
      'loc IN (123 456) - (456 789)',
    ],
  };

  var main = new Ractive({
    el: '#main-container',
    template: "#main-template",
    data: data,
    setQuery: function(v) {
      this.set('query', v);
    },
    clearQuery: function() {
      this.set('query', '');
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
