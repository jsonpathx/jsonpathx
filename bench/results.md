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
| root | `$` | false | 12,870,666 | 3,632,341 | 1,420,056 | jsonpathx |
| dot | `$.store.book[0].author` | false | 738,650 | 1,562,714 | 111,577 | jsonpath-plus |
| bracket | `$['store']['book'][0]['author']` | false | 734,568 | 1,685,094 | 80,771 | jsonpath-plus |
| wildcard | `$.store.*` | false | 607,104 | 1,970,988 | 224,515 | jsonpath-plus |
| recursive | `$..author` | false | 135,472 | 507,532 | 157,407 | jsonpath-plus |
| slice | `$.store.book[0:2]` | false | 469,657 | 1,159,001 | 126,981 | jsonpath-plus |
| union | `$.store.book[0,2]` | false | 460,312 | 1,066,603 | 106,030 | jsonpath-plus |
| filter | `$..book[?(@.price < 10)]` | native | 103,235 | 3,705 | 99,452 | tie (jsonpathx) |
| script | `$..book[(@.length-1)]` | native | 164,999 | 3,975 | 61,528 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 85,536 | 3,361 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 516,385 | 1,587,038 | unsupported | jsonpath-plus |
| type-selector | `$..*@number()` | false | 92,399 | 231,144 | unsupported | jsonpath-plus |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 9,927,074 | 3,488,235 | 1,382,767 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 12 | 36 | 0 | jsonpath-plus |
| cars-models | `$.cars[:25].model` | false | 45,605 | 128,688 | 145 | jsonpath-plus |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 300,160 | 704,651 | 313 | jsonpath-plus |
| cars-recursive | `$..engineDisplacement` | false | 1 | 10 | 2 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 9 | 22 | 0 | jsonpath-plus |
| cars-script | `$.cars[(@.length-1)].model` | native | 409,346 | 4,067 | 939 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 125,692 | 674,998 | unsupported | jsonpath-plus |
