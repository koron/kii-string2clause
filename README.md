# free style query

Convert query string to [Kii Cloud's clause][kii-querying]

## Query Types

*   eq
*   prefix
*   range
*   all
*   in
*   hasField
*   and
*   or
*   not
*   geoBox
*   geoDistance

## Expressions

### Expression for Query Types

Where X means property name.

*   eq
    *   `X = "abc"`
    *   `X = 123` - by integer
    *   `X = "123"` - by string
*   prefix
    *   `X ^= "foo"` - starts with "foo"
    *   `X PREFIX "abc"` - starts with "abc"
*   range
    *   `X <= 10`
    *   `X < 10`
    *   `X >= 20`
    *   `X > 20`
    *   `10 <= X < 20` - it would be great
*   all
    *   ~~` ` - completely empty~~
*   in
    *   `X IN ("foo" "bar" 123)`
*   hasField
    *   `HAS X {TYPE}` - type: `STRING`, `INTEGER`, `DECIMAL`, `BOOLEAN`
*   and
    *   `{EXPR1} AND {EXPR2} [...AND {EXPRn}]`
    *   `{EXPR1} and {EXPR2} [...and {EXPRn}]` - not accept mixed cases: `And`, `aNd` or so.
    *   `{EXPR1} & {EXPR2} [...& {EXPRn}]`
*   or
    *   `{EXPR1} OR {EXPR2} [...OR {EXPRn}]`
    *   `{EXPR1} or {EXPR2} [...or {EXPRn}]` - not accept mixed cases.
    *   `{EYPR1} | {EXPR2} [...| {EXPRn}]`
*   not
    *   `NOT {EXPR}`
    *   `! {EXPR}`
*   geoBox
    *   `X IN (11.0 1.0) - (1.0 17.0)`
*   geoDistance
    *   `X IN 1023 FROM (11.0 1.0)`

### Composite Clauses

*   not + eq
    *   `X != 123`
    *   `X != "abc"`

### Other Expressions

*   grouping
    *    `( {EXPR} )`
*   values
    *   `"abc"` - quoted string parsed as `abc`
    *   `123` - as integer/number
    *   `"123"` - as string `123`
    *   `-1.23e+45`, `1e10`, `1.2345` - floating point number
        *   comply with [spec of JSON's **number**](http://json.org/)
    *   `true`, `false` - boolean values
    *   `null` - null value

[kii-querying]: <http://docs.kii.com/en/guides/rest/managing-data/object-storages/querying/>
