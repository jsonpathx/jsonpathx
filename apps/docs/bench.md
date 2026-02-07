---
layout: doc
title: Benchmarks
---

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
| root | `$` | false | 10,259,215 | 3,199,291 | 1,190,807 | jsonpathx |
| dot | `$.store.book[0].author` | false | 623,327 | 1,361,336 | 92,126 | jsonpath-plus |
| bracket | `$['store']['book'][0]['author']` | false | 645,665 | 1,370,873 | 69,793 | jsonpath-plus |
| wildcard | `$.store.*` | false | 488,268 | 1,765,491 | 188,539 | jsonpath-plus |
| recursive | `$..author` | false | 116,542 | 421,495 | 130,947 | jsonpath-plus |
| slice | `$.store.book[0:2]` | false | 391,845 | 956,157 | 99,763 | jsonpath-plus |
| union | `$.store.book[0,2]` | false | 293,141 | 815,610 | 88,176 | jsonpath-plus |
| filter | `$..book[?(@.price < 10)]` | native | 83,443 | 3,348 | 84,107 | tie (jsonpath) |
| script | `$..book[(@.length-1)]` | native | 145,771 | 3,246 | 52,953 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 87,036 | 3,310 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 456,213 | 1,364,800 | unsupported | jsonpath-plus |
| type-selector | `$..*@number()` | false | 78,048 | 201,392 | unsupported | jsonpath-plus |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 8,574,357 | 2,926,682 | 1,192,542 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 10 | 32 | 0 | jsonpath-plus |
| cars-models | `$.cars[:25].model` | false | 40,687 | 100,640 | 93 | jsonpath-plus |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 208,472 | 566,075 | 254 | jsonpath-plus |
| cars-recursive | `$..engineDisplacement` | false | 1 | 9 | 2 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 6 | 16 | 0 | jsonpath-plus |
| cars-script | `$.cars[(@.length-1)].model` | native | 342,874 | 3,520 | 767 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 99,003 | 571,648 | unsupported | jsonpath-plus |
