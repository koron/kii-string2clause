var Parsimmon = require('parsimmon');

var string = Parsimmon.string;
var regex = Parsimmon.regex;
var alt = Parsimmon.alt;
var seq = Parsimmon.seq;
var seqMap = Parsimmon.seqMap;
var lazy = Parsimmon.lazy;

function lexeme(p) {
  return p.skip(Parsimmon.optWhitespace);
}

var quote = string('"');
var equal = string('=');
var lparen = string('(');
var rparen = string(')');

var keywordTrue = string('true');
var keywordFalse = string('false');
var keywordPrefix = string('PREFIX');
var keywordIn = string('IN');
var keywordHas = string('HAS');

var opLess = alt(string('<='), string('<'));
var opGreater = alt(string('>='), string('>'));
var opCmp = alt(opLess, opGreater);
var opAnd = string('AND');
var opOr = string('OR');

var typeString = string('STRING');
var typeInteger = string('INTEGER');
var typeDecimal = string('DECIMAL');
var typeBoolean = string('BOOLEAN');
var types = alt(typeString, typeInteger, typeDecimal, typeBoolean);

var qstr = seq(quote, regex(/([^"\\]|\\.)*/), quote).map(function(m) {
  return JSON.parse(m.join(''));
});
var number = regex(/[1-9][0-9]*/).map(Number);
var bool = alt(keywordTrue, keywordFalse).map(function(s) {
  return s === "true";
});
var value = alt(qstr, number, bool);

var propname = regex(/[a-zA-Z_][0-9a-zA-Z_]*/);

var exprEq = seq(lexeme(propname), lexeme(equal), value).map(function(m) {
  return { type: 'eq', field: m[0], value: m[2] };
});

var exprPrefix = seq(lexeme(propname), lexeme(keywordPrefix), qstr).map(function(m) {
  return { type: 'prefix', field: m[0], prefix: m[2] };
});

var exprRange = seq(lexeme(propname), lexeme(opCmp), number).map(function(m) {
  var c = { type: 'range', field: m[0] };
  switch (m[1]) {
    case '<':
      c['upperLimit'] = m[2];
      c['upperIncluded'] = false;
      break;
    case '<=':
      c['upperLimit'] = m[2];
      c['upperIncluded'] = true;
      break;
    case '>':
      c['lowerLimit'] = m[2];
      c['lowerIncluded'] = false;
      break;
    case '>=':
      c['lowerLimit'] = m[2];
      c['lowerIncluded'] = true;
      break;
    default:
      // FIXME: raise error.
  }
  return c;
});

var exprBetween = seqMap(lexeme(number), lexeme(opLess), lexeme(propname), lexeme(opLess), number, function(lowerVal, lowerOp, field, upperOp, upperVal) {
  return {
    type: 'range',
    field: field,
    lowerLimit: lowerVal,
    lowerIncluded: lowerOp === "<=",
    upperLimit: upperVal,
    upperIncluded: upperOp === "<=",
  };
});

var exprIn = seqMap(lexeme(propname).skip(lexeme(keywordIn)).skip(lexeme(lparen)), lexeme(value).atLeast(1).skip(lexeme(rparen)), function(field, values) {
  return {
    type: 'in',
    field: field,
    values: values,
  };
});

var exprHas = seqMap(lexeme(keywordHas), lexeme(propname), types, function(_, field, type) {
  return { type: 'hasField', field: field, fieldType: type };
});

var exprAnd = lazy('AND', function() {
  return seqMap(expr, lexeme(opAnd), expr, function(left, _, right) {
    if (left['type'] === 'and') {
      left['clauses'].push(right);
      return left;
    }
    return { type: 'and', clauses: [ left, right ] };
  });
});

var simple = alt(exprEq, exprPrefix, exprRange, exprBetween, exprIn, exprHas);

var expr = alt(simple, exprAnd);

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
exprTest('X PREFIX "abc"');
exprTest('X PREFIX"abc"');
exprTest('X >= 20');
exprTest('X > 20');
exprTest('X <= 20');
exprTest('X < 20');
exprTest('20 <= X < 30');
exprTest('X IN ("abc" 123 "foo")');
exprTest('HAS X STRING');
exprTest('HAS foo INTEGER');
exprTest('HAS y DECIMAL');
exprTest('HAS flag BOOLEAN');
exprTest('X=10');
exprTest('X=10 AND Y=20');
//exprTest('name PREFIX "John" AND age = 30');

module.exports = {
  exprEq: exprEq,
};
