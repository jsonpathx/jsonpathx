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
| root | `$` | false | 8,149,082 | 2,424,683 | 924,414 | jsonpathx |
| dot | `$.store.book[0].author` | false | 485,951 | 1,084,997 | 74,137 | jsonpath-plus |
| bracket | `$['store']['book'][0]['author']` | false | 516,933 | 1,093,244 | 56,760 | jsonpath-plus |
| wildcard | `$.store.*` | false | 347,017 | 1,288,096 | 147,677 | jsonpath-plus |
| recursive | `$..author` | false | 93,582 | 349,224 | 105,638 | jsonpath-plus |
| slice | `$.store.book[0:2]` | false | 317,275 | 785,033 | 87,842 | jsonpath-plus |
| union | `$.store.book[0,2]` | false | 309,227 | 704,445 | 73,407 | jsonpath-plus |
| filter | `$..book[?(@.price < 10)]` | native | 69,021 | 2,773 | 69,299 | tie (jsonpath) |
| script | `$..book[(@.length-1)]` | native | 122,553 | 2,840 | 43,809 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 72,367 | 2,595 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 398,749 | 1,152,793 | unsupported | jsonpath-plus |
| type-selector | `$..*@number()` | false | 65,451 | 165,211 | unsupported | jsonpath-plus |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 7,539,466 | 2,434,597 | 987,585 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 9 | 29 | 0 | jsonpath-plus |
| cars-models | `$.cars[:25].model` | false | 34,656 | 95,103 | 107 | jsonpath-plus |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 212,259 | 514,159 | 222 | jsonpath-plus |
| cars-recursive | `$..engineDisplacement` | false | 1 | 8 | 2 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 6 | 16 | 0 | jsonpath-plus |
| cars-script | `$.cars[(@.length-1)].model` | native | 300,009 | 3,329 | 1,335 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 88,025 | 468,256 | unsupported | jsonpath-plus |
