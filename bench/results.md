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
| root | `$` | false | 9,617,810 | 4,169,083 | 1,511,130 | jsonpathx |
| dot | `$.store.book[0].author` | false | 7,122,473 | 1,750,816 | 120,005 | jsonpathx |
| bracket | `$['store']['book'][0]['author']` | false | 7,845,790 | 1,747,903 | 90,302 | jsonpathx |
| union-names | `$.store['book','bicycle']` | false | 2,466,694 | 1,323,729 | 135,426 | jsonpathx |
| wildcard | `$.store.*` | false | 2,637,075 | 2,207,799 | 243,303 | jsonpathx |
| recursive | `$..author` | false | 1,495,642 | 523,858 | 165,032 | jsonpathx |
| slice | `$.store.book[0:2]` | false | 2,070,190 | 1,226,122 | 141,156 | jsonpathx |
| slice-negative | `$.store.book[-3:-1]` | false | 2,150,807 | 1,128,423 | 137,541 | jsonpathx |
| index-negative | `$.store.book[-1]` | false | 8,477,661 | 2,367,987 | 157,196 | jsonpathx |
| union | `$.store.book[0,2]` | false | 2,100,126 | 1,114,174 | 117,548 | jsonpathx |
| filter | `$..book[?(@.price < 10)]` | native | 1,279,852 | 4,442 | 105,165 | jsonpathx |
| script | `$..book[(@.length-1)]` | native | 1,150,000 | 4,051 | 67,063 | jsonpathx |
| parent | `$..book[?(@.price > 10)]^` | native | 1,038,677 | 4,406 | unsupported | jsonpathx |
| property | `$.store.*~` | false | 2,075,152 | 1,807,695 | unsupported | jsonpathx |
| type-selector | `$..*@number()` | false | 911,241 | 246,272 | unsupported | jsonpathx |
| rfc-length | `$..book[?length(@.author) > 3]` | false | 650,427 | 586,199 | unsupported | jsonpathx |
| rfc-match | `$..book[?match(@.author, '^[A-Z]')]` | false | 676,156 | 584,324 | unsupported | jsonpathx |

### Synthetic (2k items)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 10,668,923 | 3,914,872 | 1,533,049 | jsonpathx |
| synthetic-items | `$.items[*].id` | false | 8,878 | 3,632 | 514 | jsonpathx |
| synthetic-filter | `$.items[?(@.price > 750 && @.tags.featured)].id` | native | 58,259 | 806 | 4,100 | jsonpathx |
| synthetic-filter-heavy | `$.items[?(@.price > 500 && @.specs.weight < 20)].id` | native | 25,928 | 723 | 2,217 | jsonpathx |
| synthetic-recursive | `$..tags.featured` | false | 1,346 | 519 | 169 | jsonpathx |
| synthetic-groups | `$.groups[*].items[*].id` | false | 9,589 | 3,427 | 494 | jsonpathx |
| synthetic-slice | `$.items[100:500:5].price` | false | 1,175,414 | 47,404 | 4,368 | jsonpathx |
| synthetic-slice-reverse | `$.items[200:0:-3].price` | false | 1,347,183 | 2,472,971 | 4,463 | jsonpath-plus |

### Nested (tree)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 10,304,536 | 3,849,617 | 1,542,095 | jsonpathx |
| nested-recursive | `$.tree..leaf` | false | 70,282 | 17,472 | 8,857 | jsonpathx |
| nested-siblings | `$.tree.siblings[*].leaf` | false | 1,580,209 | 1,582,551 | 122,078 | tie (jsonpath-plus) |
| nested-filter | `$..[?(@.leaf == true)]` | native | 37,524 | 1,598 | 6,782 | jsonpathx |

### Wide (2k keys)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 10,508,258 | 3,863,750 | 1,530,926 | jsonpathx |
| wide-specific | `$.props.key_1999.value` | false | 7,994,061 | 1,983,713 | 175,550 | jsonpathx |
| wide-wildcard | `$.props.*.value` | false | 5,285 | 3,285 | 484 | jsonpathx |
| wide-filter | `$.props.*[?(@.nested.flag)].value` | native | unsupported | unsupported | 4 | jsonpath |
| wide-recursive | `$..value` | false | 2,558 | 831 | 452 | jsonpathx |

### Array (50k items)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 10,418,749 | 3,896,151 | 1,510,935 | jsonpathx |
| array-slice-large | `$.data[1000:5000:7]` | false | 104,218 | 12,777 | 180 | jsonpathx |
| array-union | `$.data[0,100,1000,10000]` | false | 2,342,415 | 749,750 | 287 | jsonpathx |
| array-last | `$.data[-1]` | false | 9,151,102 | 2,811,968 | 1,133 | jsonpathx |

### Unicode (quoted names)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 10,696,355 | 3,940,858 | 1,531,760 | jsonpathx |
| unicode-quoted | `$['naïve key']['emoji😀'][*]['sp ace']` | false | 1,453,878 | 1,570,580 | 86,821 | jsonpath-plus |
| unicode-recursive | `$..['sp ace']` | false | 3,171,772 | 882,599 | 220,726 | jsonpathx |

### Cars (100MB)

| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| root | `$` | false | 10,818,533 | 3,927,927 | 1,532,931 | jsonpathx |
| cars-brand | `$.cars[*].brand.name` | false | 242 | 84 | 1 | jsonpathx |
| cars-models | `$.cars[:25].model` | false | 1,388,439 | 144,244 | 322 | jsonpathx |
| cars-union | `$.cars[0,1,2].manufacturer` | false | 1,625,629 | 772,089 | 665 | jsonpathx |
| cars-recursive | `$..engineDisplacement` | false | 22 | 24 | 5 | jsonpath-plus |
| cars-filter | `$.cars[?(@.fuelType == 'Petrol')].model` | native | 338 | 46 | 2 | jsonpathx |
| cars-script | `$.cars[(@.length-1)].model` | native | 1,590,517 | 4,879 | 1,924 | jsonpathx |
| cars-property | `$.cars[0].extraFeatures.*~` | false | 932,721 | 732,727 | unsupported | jsonpathx |
