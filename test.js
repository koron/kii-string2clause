'use strict';

const assert = require('assert');
const parser = require('./string2clause.js');
const Parsimmon = require('parsimmon');

function ok(s, c) {
  var r = parser.parse(s);
  if (!r.status) {
    assert.ok(r.status, Parsimmon.formatError(s, r));
    return false;
  }
  assert.deepStrictEqual(r.value, c);
  return true;
}

ok('name = "John"', { type: 'eq', field: 'name', value: 'John' });
ok('age = 30', { type: 'eq', field: 'age', value: 30 });
ok('X = "foo \\"bar\\" baz"', { type: 'eq', field: 'X', value: 'foo "bar" baz' });
