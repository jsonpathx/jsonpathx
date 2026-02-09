---
layout: doc
title: Benchmarks
---

# Benchmarks

Generated: 2026-02-09
Node: v25.5.0

## Summary
- Each query is time-boxed per dataset (see targetMs in results.json).
- Eval is disabled unless required by a query.
- Suite includes RFC 9535 filter functions (length/match) and reverse slices.
- Datasets cover small fixtures, synthetic collections, deep trees, wide objects, large arrays, and Unicode-heavy keys.
- Datasets: 7 (fixture, synthetic, nested, wide, array, unicode, cars).
- Queries: 43 total (9 eval, 34 non-eval).
- Tags: recursion, filters, rfc-functions, reverse-slice, unicode.
- Cars dataset is loaded from bench/cars.json (~100MB).
- Some queries are unsupported by certain engines and marked as such.

## Results

### Fixture (Goessner)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 13,596,190 | 4,216,036 | 1,480,937 | jsonpathx |
| dot | `$.store.book[0].author` | false | 856,435 | 1,785,292 | 120,756 | jsonpath-plus |
| bracket | `$['store']['book'][0]['author']` | false | 878,475 | 1,760,953 | 89,163 | jsonpath-plus |
| union-names | `$.store['book','bicycle']` | false | 637,837 | 1,318,788 | 136,612 | jsonpath-plus |
| wildcard | `$.store.*` | false | 699,101 | 2,266,026 | 242,866 | jsonpath-plus |
| recursive | `$..author` | false | 148,052 | 538,449 | 169,047 | jsonpath-plus |
| slice | `$.store.book[0:2]` | false | 535,710 | 1,266,645 | 141,127 | jsonpath-plus |
| slice-negative | `$.store.book[-3:-1]` | false | 541,501 | 1,133,820 | 139,347 | jsonpath-plus |
| index-negative | `$.store.book[-1]` | false | 1,148,838 | 2,460,199 | 158,139 | jsonpath-plus |
| union | `$.store.book[0,2]` | false | 507,414 | 1,122,575 | 117,784 | jsonpath-plus |
| filter | `$..book[?(@.price < 10)]` | native | 112,441 | 4,252 | 109,874 | tie (jsonpathx) |
| script | `$..book[(@.length-1)]` | native | 190,544 | 4,173 | 70,390 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 106,538 | 4,596 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 617,596 | 1,765,076 | unsupported | jsonpath-plus |
| type-selector | `$..*@number()` | false | 103,845 | 249,064 | unsupported | jsonpath-plus |
| rfc-length | `$..book[?length(@.author) > 3]` | false | unsupported | 616,018 | unsupported | jsonpath-plus |
| rfc-match | `$..book[?match(@.author, '^[A-Z]')]` | false | unsupported | 606,477 | unsupported | jsonpath-plus |

### Synthetic (2k items)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 11,504,707 | 3,920,943 | 1,544,463 | jsonpathx |
| synthetic-items | `$.items[*].id` | false | 695 | 2,998 | 474 | jsonpath-plus |
| synthetic-filter | `$.items[?(@.price > 750 && @.tags.featured)].id` | native | 331 | 663 | 3,546 | jsonpath |
| synthetic-filter-heavy | `$.items[?(@.price > 500 && @.specs.weight < 20)].id` | native | 374 | 590 | 2,180 | jsonpath |
| synthetic-recursive | `$..tags.featured` | false | 164 | 519 | 123 | jsonpath-plus |
| synthetic-groups | `$.groups[*].items[*].id` | false | 452 | 3,218 | 492 | jsonpath-plus |
| synthetic-slice | `$.items[100:500:5].price` | false | 16,807 | 48,435 | 4,343 | jsonpath-plus |
| synthetic-slice-reverse | `$.items[200:0:-3].price` | false | 19,720 | 2,611,015 | 4,445 | jsonpath-plus |

### Nested (tree)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 11,373,721 | 4,026,104 | 1,546,662 | jsonpathx |
| nested-recursive | `$.tree..leaf` | false | 3,184 | 18,111 | 8,993 | jsonpath-plus |
| nested-siblings | `$.tree.siblings[*].leaf` | false | 545,022 | 1,656,189 | 126,923 | jsonpath-plus |
| nested-filter | `$..[?(@.leaf == true)]` | native | 1,286 | 1,699 | 6,611 | jsonpath |

### Wide (2k keys)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 11,761,778 | 3,993,256 | 1,553,476 | jsonpathx |
| wide-specific | `$.props.key_1999.value` | false | 1,034,473 | 1,864,301 | 174,630 | jsonpath-plus |
| wide-wildcard | `$.props.*.value` | false | 606 | 3,164 | 492 | jsonpath-plus |
| wide-filter | `$.props.*[?(@.nested.flag)].value` | native | unsupported | unsupported | 4 | jsonpath |
| wide-recursive | `$..value` | false | 313 | 842 | 462 | jsonpath-plus |

### Array (50k items)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 11,475,801 | 4,010,768 | 1,564,854 | jsonpathx |
| array-slice-large | `$.data[1000:5000:7]` | false | 4,001 | 12,656 | 178 | jsonpath-plus |
| array-union | `$.data[0,100,1000,10000]` | false | 418,828 | 755,852 | 608 | jsonpath-plus |
| array-last | `$.data[-1]` | false | 1,654,787 | 2,905,930 | 2,409 | jsonpath-plus |

### Unicode (quoted names)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 11,186,273 | 3,952,540 | 1,560,700 | jsonpathx |
| unicode-quoted | `$['naïve key']['emoji😀'][*]['sp ace']` | false | 274,566 | 1,515,994 | 88,059 | jsonpath-plus |
| unicode-recursive | `$..['sp ace']` | false | 262,270 | 798,735 | 221,914 | jsonpath-plus |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 11,306,657 | 3,959,344 | 1,559,701 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 27 | 83 | 1 | jsonpath-plus |
| cars-models | `$.cars[:25].model` | false | 38,971 | 141,260 | 320 | jsonpath-plus |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 245,707 | 780,188 | 662 | jsonpath-plus |
| cars-recursive | `$..engineDisplacement` | false | 3 | 23 | 5 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 17 | 43 | 1 | jsonpath-plus |
| cars-script | `$.cars[(@.length-1)].model` | native | 409,549 | 4,081 | 1,957 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 90,479 | 744,915 | unsupported | jsonpath-plus |
