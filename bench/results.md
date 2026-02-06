# Benchmarks

Generated: 2026-02-06
Node: v25.5.0

## Summary
- Each query is time-boxed per dataset (see targetMs in results.json).
- Eval is disabled unless required by a query.
- Cars dataset is loaded from bench/cars.json (~100MB).
- Some queries are unsupported by certain engines and marked as such.

## Results

### Fixture (Goessner)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 8,371,009 | 2,593,679 | 972,439 | jsonpathx |
| dot | `$.store.book[0].author` | false | 492,312 | 1,115,426 | 60,400 | jsonpath-plus |
| bracket | `$['store']['book'][0]['author']` | false | 388,084 | 1,010,620 | 54,778 | jsonpath-plus |
| wildcard | `$.store.*` | false | 409,592 | 1,416,749 | 153,262 | jsonpath-plus |
| recursive | `$..author` | false | 89,293 | 356,448 | 107,080 | jsonpath-plus |
| slice | `$.store.book[0:2]` | false | 310,773 | 692,800 | 88,098 | jsonpath-plus |
| union | `$.store.book[0,2]` | false | 312,435 | 744,220 | 74,955 | jsonpath-plus |
| filter | `$..book[?(@.price < 10)]` | native | 71,378 | 2,845 | 71,657 | tie (jsonpath) |
| script | `$..book[(@.length-1)]` | native | 123,782 | 2,887 | 43,709 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 73,173 | 2,795 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 402,728 | 1,185,186 | unsupported | jsonpath-plus |
| type-selector | `$..*@number()` | false | 67,678 | 166,403 | unsupported | jsonpath-plus |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 7,491,360 | 2,507,819 | 996,492 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 9 | 30 | 0 | jsonpath-plus |
| cars-models | `$.cars[:25].model` | false | 37,980 | 107,749 | 123 | jsonpath-plus |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 245,296 | 572,092 | 257 | jsonpath-plus |
| cars-recursive | `$..engineDisplacement` | false | 1 | 9 | 2 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 7 | 19 | 0 | jsonpath-plus |
| cars-script | `$.cars[(@.length-1)].model` | native | 340,809 | 3,571 | 1,521 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 105,300 | 543,070 | unsupported | jsonpath-plus |
