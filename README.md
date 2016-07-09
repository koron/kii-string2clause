# free style query

<http://docs.kii.com/en/guides/rest/managing-data/object-storages/querying/>

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

*   eq
    *   `X = "abc"`
    *   ~~`X = abc` - by string `abc`~~ (not supported yet)
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
    *   ~~`X BETWEEN 10 AND 20` - easy for parser, but should be consider for
        include/exclude values~~
*   all
    *   ~~` ` - completely empty~~
*   in
    *   `X IN ("foo" "bar" 123)`
*   hasField
    *   `HAS X {TYPE}` - type: `STRING`, `INTEGER`, `DECIMAL`, `BOOLEAN`
*   and
    *   `{EXPR1} AND {EXPR2} [...AND {EXPRn}]`
*   or
    *   `{EXPR1} OR {EXPR2} [...OR {EXPRn}]`
*   not
    *   `NOT {EXPR}`
    *   `! {EXPR}`
*   geoBox
    *   `X IN (11.0 1.0) - (1.0 17.0)`
*   geoDistance
    *   `X IN 1023 FROM (11.0 1.0)`

### Other Expressions

*   grouping
    *    `( {EXPR} )`
*   values
    *    `"abc"` - quoted string parsed as `abc`
    *    `123` - as integer/number
    *    `"123"` - as string `123`
    *    ~~`abc` - string `abc`~~ (not supported yet)
