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

// EqualClause
ok('name = "John"', { type:'eq', field:'name', value:'John' });
ok('age = 30', { type:'eq', field:'age', value:30 });
ok('X = "a \\"b\\" c"', { type:'eq', field:'X', value:'a "b" c' });
ok('X="abc"', { type:'eq', field:'X', value:'abc' });

// number (int+frac+exp)
ok('X=1.23e45', {type:'eq', field:'X', value:1.23e+45});
ok('X=1.23e+45', {type:'eq', field:'X', value:1.23e+45});
ok('X=1.23e-45', {type:'eq', field:'X', value:1.23e-45});
ok('X=-1.23e45', {type:'eq', field:'X', value:-1.23e+45});
ok('X=-1.23e+45', {type:'eq', field:'X', value:-1.23e+45});
ok('X=-1.23e-45', {type:'eq', field:'X', value:-1.23e-45});
// number (int+exp)
ok('X=1e23', {type:'eq', field:'X', value:1e+23});
ok('X=1e+23', {type:'eq', field:'X', value:1e+23});
ok('X=1e-23', {type:'eq', field:'X', value:1e-23});
ok('X=-1e+23', {type:'eq', field:'X', value:-1e+23});
ok('X=-1e-23', {type:'eq', field:'X', value:-1e-23});
// number (int+frac)
ok('X=1.23', {type:'eq', field:'X', value:1.23});
ok('X=-1.23', {type:'eq', field:'X', value:-1.23});
// number (int)
ok('X=12345', {type:'eq', field:'X', value:12345});
ok('X=-12345', {type:'eq', field:'X', value:-12345});

// TODO: should be failed
ok('X=+1.23e45', {type:'eq', field:'X', value:1.23e+45});
ok('X=+1.23e+45', {type:'eq', field:'X', value:1.23e+45});
ok('X=+1.23e-45', {type:'eq', field:'X', value:1.23e-45});
ok('X=+1e+23', {type:'eq', field:'X', value:1e+23});
ok('X=+1e-23', {type:'eq', field:'X', value:1e-23});
ok('X=+12345', {type:'eq', field:'X', value:12345});

// PrefixClause
ok('name PREFIX "foo"', { type:'prefix', field:'name', prefix:'foo' });
ok('V^="bar"', { type:'prefix', field:'V', prefix:'bar' });
ok('V ^= "bar"', { type:'prefix', field:'V', prefix:'bar' });

// NotClause
ok('!A=123', {type:'not', clause:{type:'eq', field:'A', value:123}});
ok('NOT A=123', {type:'not', clause:{type:'eq', field:'A', value:123}});

// RangeClause (single)
ok('X<12', {type:'range', field:'X', upperLimit:12, upperIncluded:false});
ok('X<=34', {type:'range', field:'X', upperLimit:34, upperIncluded:true});
ok('X>12', {type:'range', field:'X', lowerLimit:12, lowerIncluded:false});
ok('X>=34', {type:'range', field:'X', lowerLimit:34, lowerIncluded:true});
// RangeClause (between)
ok('12<=X<=34', {type:'range', field:'X', lowerLimit:12, upperLimit:34,
  lowerIncluded:true, upperIncluded:true});
ok('12<=X<34', {type:'range', field:'X', lowerLimit:12, upperLimit:34,
  lowerIncluded:true, upperIncluded:false});
ok('12<X<=34', {type:'range', field:'X', lowerLimit:12, upperLimit:34,
  lowerIncluded:false, upperIncluded:true});
ok('12<X<34', {type:'range', field:'X', lowerLimit:12, upperLimit:34,
  lowerIncluded:false, upperIncluded:false});

// InClause
ok('X IN (123 456 789)', {type:'in', field:'X', values:[123, 456, 789]});
ok('X IN (123 "abc" true)', {type:'in', field:'X', values:[123, "abc", true]});
ok('X IN (false)', {type:'in', field:'X', values:[false]});

// HasFieldClause
ok('HAS X STRING', {type:'hasField', field:'X', fieldType:'STRING'});
ok('HAS Y INTEGER', {type:'hasField', field:'Y', fieldType:'INTEGER'});
ok('HAS Z DECIMAL', {type:'hasField', field:'Z', fieldType:'DECIMAL'});
ok('HAS XYZ BOOLEAN', {type:'hasField', field:'XYZ', fieldType:'BOOLEAN'});

// AndClause
ok('X=10 AND Y=20', {type:'and', clauses:[
  {type:'eq', field:'X', value:10},
  {type:'eq', field:'Y', value:20}
]});
ok('X=10 AND Y=20 AND Z=30', {type:'and', clauses:[
  {type:'eq', field:'X', value:10},
  {type:'eq', field:'Y', value:20},
  {type:'eq', field:'Z', value:30}
]});

// OrClause
ok('X=10 OR Y=20', {type:'or', clauses:[
  {type:'eq', field:'X', value:10},
  {type:'eq', field:'Y', value:20}
]});
ok('X=10 OR Y=20 OR Z=30', {type:'or', clauses:[
  {type:'eq', field:'X', value:10},
  {type:'eq', field:'Y', value:20},
  {type:'eq', field:'Z', value:30}
]});

// GroupClause
ok('X=10 AND Y=20 OR Z=30', {type:'and', clauses:[
  {type:'eq', field:'X', value:10},
  {type:'or', clauses:[
    {type:'eq', field:'Y', value:20},
    {type:'eq', field:'Z', value:30}
  ]}
]});
ok('(X=10 AND Y=20) OR Z=30', {type:'or', clauses:[
  {type:'and', clauses:[
    {type:'eq', field:'X', value:10},
    {type:'eq', field:'Y', value:20}
  ]},
  {type:'eq', field:'Z', value:30}
]});
ok('X=10 AND (Y=20 OR Z=30)', {type:'and', clauses:[
  {type:'eq', field:'X', value:10},
  {type:'or', clauses:[
    {type:'eq', field:'Y', value:20},
    {type:'eq', field:'Z', value:30}
  ]}
]});
