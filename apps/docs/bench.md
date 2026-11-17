---
layout: doc
title: Benchmarks
---

# Benchmarks

Generated: 2026-11-17
Node: v26.13.1

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
| root | `$` | false | 14,963,706 | 2,802,453 | 1,491,871 | jsonpathx |
| dot | `$.store.book[0].author` | false | 7,343,354 | 1,715,892 | 122,906 | jsonpathx |
| bracket | `$['store']['book'][0]['author']` | false | 8,442,178 | 1,433,173 | 85,504 | jsonpathx |
| union-names | `$.store['book','bicycle']` | false | 1,984,933 | 807,691 | 126,958 | jsonpathx |
| wildcard | `$.store.*` | false | 1,843,785 | 1,416,376 | 166,200 | jsonpathx |
| recursive | `$..author` | false | 1,113,484 | 346,661 | 145,221 | jsonpathx |
| slice | `$.store.book[0:2]` | false | 1,972,924 | 1,254,379 | 143,049 | jsonpathx |
| slice-negative | `$.store.book[-3:-1]` | false | 2,133,587 | 1,221,361 | 145,661 | jsonpathx |
| index-negative | `$.store.book[-1]` | false | 8,928,283 | 2,390,828 | 164,457 | jsonpathx |
| union | `$.store.book[0,2]` | false | 2,101,358 | 1,202,653 | 109,514 | jsonpathx |
| filter | `$..book[?(@.price < 10)]` | native | 1,235,846 | 4,697 | 106,507 | jsonpathx |
| script | `$..book[(@.length-1)]` | native | 1,102,038 | 5,107 | 50,833 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 1,011,842 | 4,638 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 2,086,270 | 1,763,947 | unsupported | jsonpathx |
| type-selector | `$..*@number()` | false | 869,081 | 233,086 | unsupported | jsonpathx |
| rfc-length | `$..book[?length(@.author) > 3]` | false | 655,405 | 647,425 | unsupported | tie (jsonpathx) |
| rfc-match | `$..book[?match(@.author, '^[A-Z]')]` | false | 727,563 | 647,431 | unsupported | jsonpathx |

### Synthetic (2k items)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 13,745,888 | 3,596,121 | 1,737,140 | jsonpathx |
| synthetic-items | `$.items[*].id` | false | 8,297 | 3,818 | 645 | jsonpathx |
| synthetic-filter | `$.items[?(@.price > 750 && @.tags.featured)].id` | native | 47,718 | 697 | 2,219 | jsonpathx |
| synthetic-filter-heavy | `$.items[?(@.price > 500 && @.specs.weight < 20)].id` | native | 25,394 | 666 | 1,558 | jsonpathx |
| synthetic-recursive | `$..tags.featured` | false | 1,243 | 560 | 187 | jsonpathx |
| synthetic-groups | `$.groups[*].items[*].id` | false | 8,864 | 3,462 | 609 | jsonpathx |
| synthetic-slice | `$.items[100:500:5].price` | false | 1,064,512 | 49,701 | 4,741 | jsonpathx |
| synthetic-slice-reverse | `$.items[200:0:-3].price` | false | 1,284,326 | 60,286 | 4,880 | jsonpathx |

### Nested (tree)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 11,467,280 | 3,404,909 | 1,388,030 | jsonpathx |
| nested-recursive | `$.tree..leaf` | false | 65,697 | 17,635 | 9,091 | jsonpathx |
| nested-siblings | `$.tree.siblings[*].leaf` | false | 1,620,834 | 1,559,375 | 114,242 | tie (jsonpathx) |
| nested-filter | `$..[?(@.leaf == true)]` | native | 35,467 | 1,517 | 5,927 | jsonpathx |

### Wide (2k keys)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 12,511,169 | 3,430,519 | 1,607,303 | jsonpathx |
| wide-specific | `$.props.key_1999.value` | false | 8,526,076 | 1,988,590 | 171,027 | jsonpathx |
| wide-wildcard | `$.props.*.value` | false | 4,739 | 3,262 | 587 | jsonpathx |
| wide-filter | `$.props.*[?(@.nested.flag)].value` | native | unsupported | unsupported | 5 | jsonpath |
| wide-recursive | `$..value` | false | 2,198 | 869 | 490 | jsonpathx |

### Array (50k items)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 13,431,156 | 3,564,463 | 1,727,147 | jsonpathx |
| array-slice-large | `$.data[1000:5000:7]` | false | 104,337 | 15,071 | 203 | jsonpathx |
| array-union | `$.data[0,100,1000,10000]` | false | 2,628,663 | 859,313 | 608 | jsonpathx |
| array-last | `$.data[-1]` | false | 11,466,354 | 2,719,872 | 2,289 | jsonpathx |

### Unicode (quoted names)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 13,122,257 | 3,480,163 | 1,670,296 | jsonpathx |
| unicode-quoted | `$['naïve key']['emoji😀'][*]['sp ace']` | false | 1,624,593 | 1,514,365 | 93,090 | jsonpathx |
| unicode-recursive | `$..['sp ace']` | false | 3,320,936 | 930,488 | 243,693 | jsonpathx |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 13,683,117 | 3,605,977 | 1,741,704 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 265 | 85 | 1 | jsonpathx |
| cars-models | `$.cars[:25].model` | false | 1,387,173 | 164,681 | 365 | jsonpathx |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 1,613,046 | 885,678 | 640 | jsonpathx |
| cars-recursive | `$..engineDisplacement` | false | 20 | 24 | 5 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 319 | 42 | 3 | jsonpathx |
| cars-script | `$.cars[(@.length-1)].model` | native | 1,765,581 | 5,634 | 1,891 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 954,832 | 737,407 | unsupported | jsonpathx |
