var Parsimmon = require('parsimmon');

var string = Parsimmon.string;
var regex = Parsimmon.regex;
var alt = Parsimmon.alt;
var seq = Parsimmon.seq;
var seqMap = Parsimmon.seqMap;
var lazy = Parsimmon.lazy;
var sepBy = Parsimmon.sepBy;

function lexeme(p) {
  return p.skip(Parsimmon.optWhitespace);
}

var quote = string('"');
var equal = string('=');
var lparen = string('(');
var rparen = string(')');
var exclam = string('!');

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
var opNot = string('NOT');

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

var simple = lazy('simple expression', function() {
  return alt(exprEq, exprPrefix, exprRange, exprBetween, exprIn, exprHas,
      exprNot, exprGroup);
});

var complex = lazy('complex expression', function() {
  return alt(exprAnd, exprOr);
});

var expr = lazy('expression', function() {
  return alt(complex, simple);
});

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

var exprAnd = seqMap(lexeme(simple).skip(lexeme(opAnd)), lexeme(expr), function(left, right) {
  if (right['type'] === 'and') {
    right['clauses'].unshift(left);
    return right;
  }
  return { type: 'and', clauses: [ left, right ] };
});

var exprOr = seqMap(lexeme(simple).skip(lexeme(opOr)), lexeme(expr), function(left, right) {
  if (right['type'] === 'or') {
    right['clauses'].unshift(left);
    return right;
  }
  return { type: 'or', clauses: [ left, right ] };
});

var exprGroup = seqMap(lexeme(lparen), lexeme(complex).skip(rparen), function(_, clause) {
  return clause;
});

var exprNot = seqMap(lexeme(alt(exclam, opNot)), expr, function(_, clause) {
  return { type: 'or', clause: clause };
});

function t(query) {
  console.log("IN:", query);
  var r = expr.parse(query);
  if (!r.status) {
    console.log("ERROR:", Parsimmon.formatError(query, r));
    console.log("");
    return;
  }
  console.log("OUT:", JSON.stringify(r.value, null, 2));
  console.log("");
}

t('X = "abc"');
t('X = 123');
t('X = "123"');
t('X = "including \\"quote\\" in string"');
t('X PREFIX "abc"');
t('X PREFIX"abc"');
t('X >= 20');
t('X > 20');
t('X <= 20');
t('X < 20');
t('20 <= X < 30');
t('X IN ("abc" 123 "foo")');
t('HAS X STRING');
t('HAS foo INTEGER');
t('HAS y DECIMAL');
t('HAS flag BOOLEAN');
t('X=10');
t('name PREFIX "John" AND age = 30');
t('X=10 AND Y=20 AND Z=30');
t('name = "John" OR age = 30');
t('X=10 OR Y=20 OR Z=30');
t('!X="abc"');
t('NOT X=123');
t('X=10 AND Y=20 OR Z=30');
t('X=10 OR Y=20 AND Z=30');
t('(X=10 AND Y=20) OR Z=30');
t('(X=10 OR Y=20) AND Z=30');

module.exports = {
  exprEq: exprEq,
};
