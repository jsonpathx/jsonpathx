# Benchmarks

Generated: 2026-02-08
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
| root | `$` | false | 11,804,250 | 4,139,481 | 1,574,439 | jsonpathx |
| dot | `$.store.book[0].author` | false | 829,904 | 1,783,195 | 122,000 | jsonpath-plus |
| bracket | `$['store']['book'][0]['author']` | false | 845,170 | 1,795,923 | 91,119 | jsonpath-plus |
| wildcard | `$.store.*` | false | 679,023 | 2,301,593 | 245,704 | jsonpath-plus |
| recursive | `$..author` | false | 152,734 | 542,912 | 170,488 | jsonpath-plus |
| slice | `$.store.book[0:2]` | false | 523,379 | 1,243,078 | 142,802 | jsonpath-plus |
| union | `$.store.book[0,2]` | false | 493,767 | 1,137,977 | 117,740 | jsonpath-plus |
| filter | `$..book[?(@.price < 10)]` | native | 105,411 | 4,014 | 109,545 | tie (jsonpath) |
| script | `$..book[(@.length-1)]` | native | 191,812 | 3,949 | 71,413 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 110,785 | 4,621 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 603,567 | 1,810,275 | unsupported | jsonpath-plus |
| type-selector | `$..*@number()` | false | 101,760 | 246,800 | unsupported | jsonpath-plus |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 10,453,576 | 3,709,072 | 1,543,860 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 24 | 86 | 1 | jsonpath-plus |
| cars-models | `$.cars[:25].model` | false | 50,064 | 141,948 | 315 | jsonpath-plus |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 324,972 | 792,899 | 670 | jsonpath-plus |
| cars-recursive | `$..engineDisplacement` | false | 3 | 23 | 5 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 18 | 41 | 2 | jsonpath-plus |
| cars-script | `$.cars[(@.length-1)].model` | native | 433,767 | 4,632 | 1,903 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 141,991 | 746,544 | unsupported | jsonpath-plus |
