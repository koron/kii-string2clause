var Parsimmon = require('parsimmon');

var string = Parsimmon.string;
var regex = Parsimmon.regex;
var alt = Parsimmon.alt;
var seq = Parsimmon.seq;
var lazy = Parsimmon.lazy;

function lexeme(p) {
  return p.skip(Parsimmon.optWhitespace);
}

var quote = string('"');
var equal = string('=');
var keywordTrue = string('true');
var keywordFalse = string('false');

var qstr = seq(quote, regex(/([^"\\]|\\.)*/), quote).map(function(m) {
  return JSON.parse(m.join(''));
});
var number = regex(/[1-9][0-9]*/).map(Number);
var bool = alt(keywordTrue, keywordFalse).map(function(s) {
  return s === "true";
});
var value = alt(qstr, number, bool);

var propname = regex(/[a-zA-Z_][0-9a-zA-Z_]*/);

var exprEq = seq(lexeme(propname), lexeme(equal), lexeme(value)).map(function(m) {
  return { type: 'eq', field: m[0], value: m[2] };
});

var expr = lazy('expression', function() { return exprEq; });

function exprTest(query) {
  console.log("IN:", query);
  var clause = expr.parse(query).value;
  if (!clause) {
    console.log("ERROR");
    console.log("");
    return;
  }
  console.log("OUT:", clause);
  console.log("");
}

exprTest('X = "abc"');
exprTest('X = 123');
exprTest('X = "123"');
exprTest('X = "including \\"quote\\" in string"');

module.exports = {
  exprEq: exprEq,
};
