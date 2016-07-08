(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window).
    root.Parser = factory();
  }
}(this, function() {
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

  var vint = regex(/[+-]?[1-9][0-9]*/);
  var vfrac = seqMap(period, regex(/[0-9]+/), join);
  var vexp = seqMap(regex(/e/i), vint, join);
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
  var value = alt(qstr, number, bool, vnull);
  var pos = seqMap(lexeme(lparen), lexeme(number), lexeme(number).skip(rparen), function(_, lat, lon) {
    return { "_type": "point", lat: lat, lon: lon };
  });

  var propname = regex(/[a-zA-Z_][0-9a-zA-Z_]*/);

  var simple = lazy('simple expression', function() {
    return alt(exprEq, exprPrefix, exprRange, exprBetween,
        exprGeoBox, exprGeoDist,
        exprIn, exprHas,
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

  var exprNot = seqMap(lexeme(alt(exclam, opNot)), expr, function(_, clause) {
    return { type: 'not', clause: clause };
  });

  var exprGroup = seqMap(lexeme(lparen), lexeme(alt(complex, exprNot)).skip(rparen), function(_, clause) {
    return clause;
  });

  return expr;
}));
