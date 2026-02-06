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
| root | `$` | false | 8,698,025 | 2,601,408 | 1,005,291 | jsonpathx |
| dot | `$.store.book[0].author` | false | 441,823 | 1,127,519 | 61,920 | jsonpath-plus |
| bracket | `$['store']['book'][0]['author']` | false | 537,609 | 1,164,889 | 55,351 | jsonpath-plus |
| wildcard | `$.store.*` | false | 412,202 | 1,416,373 | 148,486 | jsonpath-plus |
| recursive | `$..author` | false | 98,687 | 340,321 | 110,271 | jsonpath-plus |
| slice | `$.store.book[0:2]` | false | 325,960 | 816,342 | 90,344 | jsonpath-plus |
| union | `$.store.book[0,2]` | false | 317,714 | 745,865 | 75,425 | jsonpath-plus |
| filter | `$..book[?(@.price < 10)]` | native | 72,839 | 2,942 | 70,855 | tie (jsonpathx) |
| script | `$..book[(@.length-1)]` | native | 129,273 | 2,935 | 45,612 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 74,752 | 2,747 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 395,735 | 1,186,723 | unsupported | jsonpath-plus |
| type-selector | `$..*@number()` | false | 67,088 | 172,668 | unsupported | jsonpath-plus |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 7,321,861 | 2,500,951 | 1,006,322 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 9 | 27 | 0 | jsonpath-plus |
| cars-models | `$.cars[:25].model` | false | 30,479 | 88,036 | 92 | jsonpath-plus |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 200,091 | 453,824 | 196 | jsonpath-plus |
| cars-recursive | `$..engineDisplacement` | false | 1 | 7 | 2 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 4 | 12 | 0 | jsonpath-plus |
| cars-script | `$.cars[(@.length-1)].model` | native | 282,562 | 2,650 | 1,234 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 83,142 | 440,801 | unsupported | jsonpath-plus |
