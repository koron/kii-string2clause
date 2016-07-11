(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['parsimmon'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('parsimmon'));
  } else {
    // Browser globals (root is window).
    root.Parser = factory(root.Parsimmon);
  }
}(this, function(Parsimmon) {
  "use strict";

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

  function join() {
    return Array.prototype.join.call(arguments, '');
  }

  var quote = string('"');
  var equal = string('=');
  var neq = string('!=');
  var lparen = string('(');
  var rparen = string(')');
  var exclam = string('!');
  var hyphen = string('-');
  var period = string('.');

  var keywordTrue = string('true');
  var keywordFalse = string('false');
  var keywordNull = string('null');
  var keywordPrefix = string('PREFIX');
  var keywordIn = string('IN');
  var keywordHas = string('HAS');
  var keywordFrom = string('FROM');

  var opLess = alt(string('<='), string('<')).map(function(op) {
    return {
      limitField: 'upperLimit',
      includedField: 'upperIncluded',
      includedValue: op === '<=',
    };
  });
  var opGreater = alt(string('>='), string('>')).map(function(op) {
    return {
      limitField: 'lowerLimit',
      includedField: 'lowerIncluded',
      includedValue: op === '>=',
    };
  });
  var opCmp = alt(opLess, opGreater);
  var opAnd = string('AND');
  var opOr = string('OR');
  var opNot = string('NOT');
  var opPrefix = string('^=');

  var typeString = string('STRING');
  var typeInteger = string('INTEGER');
  var typeDecimal = string('DECIMAL');
  var typeBoolean = string('BOOLEAN');
  var types = alt(typeString, typeInteger, typeDecimal, typeBoolean);

  var qstr = seq(quote, regex(/([^"\\]|\\.)*/), quote).map(function(m) {
    return JSON.parse(m.join(''));
  }).desc("a quoted string");

  var digits = regex(/[0-9]+/);
  var vint = regex(/[+-]?(0|[1-9][0-9]*)/);
  var vfrac = seqMap(period, digits, join);
  var vexp = seqMap(regex(/e[+-]?/i), digits, join);
  var vintFrac = seqMap(vint, vfrac, join);
  var vintExp = seqMap(vint, vexp, join);
  var vintFracExp = seqMap(vint, vfrac, vexp, join);

  var number = alt(vintFracExp, vintExp, vintFrac, vint).map(Number);
  var bool = alt(keywordTrue, keywordFalse).map(function(s) {
    return s === "true";
  });
  var vnull = keywordNull.map(function(s) {
    return null;
  });
  var value = alt(qstr, number, bool, vnull).desc('a value');
  var pos = seqMap(lexeme(lparen).then(lexeme(number)), lexeme(number).skip(rparen), function(lat, lon) {
    return { "_type": "point", lat: lat, lon: lon };
  });

  var propname = regex(/[a-zA-Z_][0-9a-zA-Z_]*/);

  var simple = lazy('simple expression', function() {
    return alt(exprEq, exprNeq, exprPrefix, exprRange, exprBetween,
        exprGeoBox, exprGeoDist, exprIn, exprHas, exprNot, exprGroup);
  });

  var complex = lazy('complex expression', function() {
    return alt(exprAnd, exprOr);
  });

  var expr = lazy('expression', function() {
    return alt(complex, simple);
  });

  var exprEq = seqMap(lexeme(propname).skip(lexeme(equal)), value, function(field, value) {
    return { type: 'eq', field: field, value: value };
  });

  var exprNeq = seqMap(lexeme(propname).skip(lexeme(neq)), value, function(field, value) {
    return { type: 'not', clause: { type: 'eq', field: field, value: value } };
  });

  var exprPrefix = seqMap(lexeme(propname).skip(lexeme(alt(opPrefix, keywordPrefix))), qstr, function(field, prefix) {
    return { type: 'prefix', field: field, prefix: prefix };
  });

  var exprRange = seqMap(lexeme(propname), lexeme(opCmp), number, function(field, op, limit) {
    var c = { type: 'range', field: field };
    c[op.limitField] = limit;
    c[op.includedField] = op.includedValue;
    return c;
  });

  var exprBetween = seqMap(lexeme(number), lexeme(opLess), lexeme(propname), lexeme(opLess), number, function(lowerVal, lowerOp, field, upperOp, upperVal) {
    return {
      type: 'range',
      field: field,
      lowerLimit: lowerVal,
      lowerIncluded: lowerOp.includedValue,
      upperLimit: upperVal,
      upperIncluded: upperOp.includedValue,
    };
  });

  var exprIn = seqMap(lexeme(propname).skip(lexeme(keywordIn)).skip(lexeme(lparen)), lexeme(value).atLeast(1).skip(lexeme(rparen)), function(field, values) {
    return {
      type: 'in',
      field: field,
      values: values,
    };
  });

  var exprHas = seqMap(lexeme(keywordHas).then(lexeme(propname)), types, function(field, type) {
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

  var exprGeoBox = seqMap(lexeme(propname).skip(lexeme(keywordIn)), lexeme(pos).skip(lexeme(hyphen)), pos, function(field, ne, sw) {
    return {
      type: "geobox",
      field: field,
      box: { ne: ne, sw: sw, },
    };
  });

  var exprGeoDist = seqMap(lexeme(propname).skip(lexeme(keywordIn)), lexeme(number).skip(lexeme(keywordFrom)), pos, function(field, radius, center) {
    return {
      type: "geodistance",
      field: field,
      center: center,
      radius: radius,
      putDistanceInto: "myDist",
    }
  });

  var exprNot = seqMap(lexeme(alt(exclam, opNot)).then(expr), function(clause) {
    return { type: 'not', clause: clause };
  });

  var exprGroup = seqMap(lexeme(lparen).then(lexeme(alt(complex, exprNot))).skip(rparen), function(clause) {
    return clause;
  });

  return {
    parse: function(s) {
      return expr.parse(s);
    },
    formatError: function(r, s) {
      return Parsimmon.formatError(r, s);
    }
  }
}));
