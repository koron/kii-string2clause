'use strict';

const assert = require('assert');
const parser = require('./string2clause.js');

function ok(s, c) {
  var r = parser.parse(s);
  if (!r.status) {
    assert.ok(r.status, parser.formatError(s, r));
    return false;
  }
  assert.deepStrictEqual(r.value, c);
  return true;
}

// number (int+frac+exp)
ok('X=1.23e45', {type:'eq', field:'X', value:1.23e+45});
ok('X=1.23e+45', {type:'eq', field:'X', value:1.23e+45});
ok('X=1.23e-45', {type:'eq', field:'X', value:1.23e-45});
ok('X=-1.23e45', {type:'eq', field:'X', value:-1.23e+45});
ok('X=-1.23e+45', {type:'eq', field:'X', value:-1.23e+45});
ok('X=-1.23e-45', {type:'eq', field:'X', value:-1.23e-45});
ok('X=+1.23e45', {type:'eq', field:'X', value:1.23e+45});
ok('X=+1.23e+45', {type:'eq', field:'X', value:1.23e+45});
ok('X=+1.23e-45', {type:'eq', field:'X', value:1.23e-45});
// number (int+exp)
ok('X=1e23', {type:'eq', field:'X', value:1e+23});
ok('X=1e+23', {type:'eq', field:'X', value:1e+23});
ok('X=1e-23', {type:'eq', field:'X', value:1e-23});
ok('X=-1e+23', {type:'eq', field:'X', value:-1e+23});
ok('X=-1e-23', {type:'eq', field:'X', value:-1e-23});
ok('X=+1e+23', {type:'eq', field:'X', value:1e+23});
ok('X=+1e-23', {type:'eq', field:'X', value:1e-23});
// number (int+frac)
ok('X=1.23', {type:'eq', field:'X', value:1.23});
ok('X=-1.23', {type:'eq', field:'X', value:-1.23});
// number (int)
ok('X=12345', {type:'eq', field:'X', value:12345});
ok('X=-12345', {type:'eq', field:'X', value:-12345});

// EqualClause
ok('name = "John"', { type: 'eq', field: 'name', value: 'John' });
ok('age = 30', { type: 'eq', field: 'age', value: 30 });
ok('X = "a \\"b\\" c"', { type: 'eq', field: 'X', value: 'a "b" c' });
ok('X="abc"', { type: 'eq', field: 'X', value: 'abc' });

// PrefixClause
ok('name PREFIX "foo"', { type:'prefix', field:'name', prefix:'foo' });
ok('V^="bar"', { type:'prefix', field:'V', prefix:'bar' });
ok('V ^= "bar"', { type:'prefix', field:'V', prefix:'bar' });

// NotClause
ok('!A=123', {type:'not', clause:{type:'eq', field:'A', value:123}});
ok('NOT A=123', {type:'not', clause:{type:'eq', field:'A', value:123}});
