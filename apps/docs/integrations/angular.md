# Angular Integration

Complete guide to using jsonpathx with Angular. Learn how to integrate JSONPath queries with services, pipes, directives, and reactive patterns.

## Installation

```bash
npm install jsonpathx
```

## Service Integration

### JSONPath Service

```typescript
// services/jsonpath.service.ts
import { Injectable } from '@angular/core';
import { JSONPath, QueryOptions } from 'jsonpathx';
import { Observable, from, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JsonPathService {
  private queryCache = new Map<string, Observable<any>>();

  query<T = unknown>(
    path: string,
    data: unknown,
    options?: QueryOptions
  ): Observable<T[]> {
    const cacheKey = `${path}:${JSON.stringify(options)}`;

    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    const query$ = from(
      JSONPath.query<T>(path, data, options)
    ).pipe(
      catchError(error => {
        console.error('JSONPath query error:', error);
        return of([]);
      }),
      shareReplay(1)
    );

    this.queryCache.set(cacheKey, query$);

    return query$;
  }

  clearCache(): void {
    this.queryCache.clear();
  }
}
```

### Usage in Component

```typescript
// components/user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { JsonPathService } from '../services/jsonpath.service';

interface User {
  id: number;
  name: string;
  active: boolean;
}

@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="users$ | async as users">
      <h2>Active Users</h2>
      <ul>
        <li *ngFor="let user of users">
          {{ user.name }}
        </li>
      </ul>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users$: Observable<User[]>;

  constructor(private jsonPath: JsonPathService) {}

  ngOnInit(): void {
    const data = {
      users: [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
        { id: 3, name: 'Charlie', active: true }
      ]
    };

    this.users$ = this.jsonPath.query<User>(
      '$.users[?(@.active === true)]',
      data
    );
  }
}
```

## Custom Pipe

### JSONPath Pipe

```typescript
// pipes/jsonpath.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { JSONPath } from 'jsonpathx';

@Pipe({
  name: 'jsonpath',
  pure: false
})
export class JsonPathPipe implements PipeTransform {
  private cache = new Map<string, Promise<any>>();

  async transform(data: any, path: string): Promise<any[]> {
    const cacheKey = `${JSON.stringify(data)}:${path}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const promise = JSONPath.query(path, data);
    this.cache.set(cacheKey, promise);

    return promise;
  }
}
```

### Usage in Template

```typescript
@Component({
  selector: 'app-data-view',
  template: `
    <div *ngIf="data">
      <h2>Products</h2>
      <ul>
        <li *ngFor="let item of data | jsonpath: '$.products[*]' | async">
          {{ item.name }}
        </li>
      </ul>
    </div>
  `
})
export class DataViewComponent {
  data = {
    products: [
      { id: 1, name: 'Laptop' },
      { id: 2, name: 'Phone' }
    ]
  };
}
```

## Directive

### JSONPath Query Directive

```typescript
// directives/jsonpath-query.directive.ts
import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { JSONPath } from 'jsonpathx';

@Directive({
  selector: '[appJsonpathQuery]'
})
export class JsonpathQueryDirective implements OnChanges {
  @Input() appJsonpathQuery: string = '';
  @Input() jsonpathData: any;
  @Output() queryResult = new EventEmitter<any[]>();
  @Output() queryError = new EventEmitter<Error>();

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['appJsonpathQuery'] || changes['jsonpathData']) {
      try {
        const result = await JSONPath.query(
          this.appJsonpathQuery,
          this.jsonpathData
        );
        this.queryResult.emit(result);
      } catch (error) {
        this.queryError.emit(error as Error);
      }
    }
  }
}
```

### Usage

```typescript
@Component({
  template: `
    <div
      appJsonpathQuery="$.users[*]"
      [jsonpathData]="data"
      (queryResult)="onResult($event)"
      (queryError)="onError($event)">
    </div>

    <ul>
      <li *ngFor="let user of users">{{ user.name }}</li>
    </ul>
  `
})
export class MyComponent {
  data = { users: [/* ... */] };
  users: any[] = [];

  onResult(result: any[]): void {
    this.users = result;
  }

  onError(error: Error): void {
    console.error('Query failed:', error);
  }
}
```

## State Management (NgRx)

### Actions

```typescript
// store/data.actions.ts
import { createAction, props } from '@ngrx/store';

export const queryData = createAction(
  '[Data] Query',
  props<{ path: string }>()
);

export const queryDataSuccess = createAction(
  '[Data] Query Success',
  props<{ path: string; result: any[] }>()
);

export const queryDataFailure = createAction(
  '[Data] Query Failure',
  props<{ error: Error }>()
);
```

### Effects

```typescript
// store/data.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { JSONPath } from 'jsonpathx';
import * as DataActions from './data.actions';

@Injectable()
export class DataEffects {
  query$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DataActions.queryData),
      switchMap(({ path }) =>
        from(JSONPath.query(path, this.getData())).pipe(
          map(result => DataActions.queryDataSuccess({ path, result })),
          catchError(error => of(DataActions.queryDataFailure({ error })))
        )
      )
    )
  );

  constructor(private actions$: Actions) {}

  private getData(): any {
    // Get data from store or service
    return {};
  }
}
```

### Reducer

```typescript
// store/data.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as DataActions from './data.actions';

export interface DataState {
  queryResults: Record<string, any[]>;
  loading: boolean;
  error: Error | null;
}

const initialState: DataState = {
  queryResults: {},
  loading: false,
  error: null
};

export const dataReducer = createReducer(
  initialState,
  on(DataActions.queryData, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DataActions.queryDataSuccess, (state, { path, result }) => ({
    ...state,
    queryResults: {
      ...state.queryResults,
      [path]: result
    },
    loading: false
  })),
  on(DataActions.queryDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
```

## Reactive Forms

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { JsonPathService } from '../services/jsonpath.service';

@Component({
  selector: 'app-product-filter',
  template: `
    <form [formGroup]="filterForm">
      <input formControlName="minPrice" type="number" placeholder="Min Price">
      <input formControlName="maxPrice" type="number" placeholder="Max Price">
      <select formControlName="category">
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>
    </form>

    <div *ngIf="products$ | async as products">
      <div *ngFor="let product of products">
        {{ product.name }} - ${{ product.price }}
      </div>
    </div>
  `
})
export class ProductFilterComponent implements OnInit {
  filterForm: FormGroup;
  products$: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private jsonPath: JsonPathService
  ) {
    this.filterForm = this.fb.group({
      minPrice: [0],
      maxPrice: [1000],
      category: ['']
    });
  }

  ngOnInit(): void {
    this.products$ = this.filterForm.valueChanges.pipe(
      debounceTime(300),
      switchMap(filters => {
        const sandbox = {
          matchesFilters: (product: any) => {
            return product.price >= filters.minPrice &&
                   product.price <= filters.maxPrice &&
                   (!filters.category || product.category === filters.category);
          }
        };

        return this.jsonPath.query(
          '$.products[?(@.matchesFilters())]',
          this.getData(),
          { sandbox }
        );
      })
    );
  }

  private getData(): any {
    return {
      products: [/* ... */]
    };
  }
}
```

## HTTP Integration

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { JSONPath } from 'jsonpathx';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  queryAPI<T>(url: string, path: string): Observable<T[]> {
    return this.http.get(url).pipe(
      switchMap(data => from(JSONPath.query<T>(path, data)))
    );
  }

  // Example: Get active users from API
  getActiveUsers(): Observable<User[]> {
    return this.queryAPI<User>(
      '/api/users',
      '$.users[?(@.active === true)]'
    );
  }
}
```

## Testing

```typescript
// services/jsonpath.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { JsonPathService } from './jsonpath.service';

describe('JsonPathService', () => {
  let service: JsonPathService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonPathService);
  });

  it('should query data', async () => {
    const data = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    };

    const result = await service.query('$.users[*].name', data).toPromise();

    expect(result).toEqual(['Alice', 'Bob']);
  });

  it('should cache queries', async () => {
    const data = { items: [1, 2, 3] };

    const result1$ = service.query('$.items[*]', data);
    const result2$ = service.query('$.items[*]', data);

    expect(result1$).toBe(result2$);
  });
});
```

## Performance Optimization

### 1. Change Detection Strategy

```typescript
@Component({
  selector: 'app-data-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngFor="let item of items$ | async">
      {{ item.name }}
    </div>
  `
})
export class DataListComponent {
  items$ = this.jsonPath.query('$.items[*]', this.data);

  constructor(private jsonPath: JsonPathService) {}
}
```

### 2. Memoization

```typescript
import { memoize } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class JsonPathService {
  private memoizedQuery = memoize(
    (path: string, data: unknown) => JSONPath.query(path, data),
    (path, data) => `${path}:${JSON.stringify(data)}`
  );

  query(path: string, data: unknown): Observable<any[]> {
    return from(this.memoizedQuery(path, data));
  }
}
```

## Module Setup

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { JSONPath } from 'jsonpathx';

import { JsonPathService } from './services/jsonpath.service';
import { JsonPathPipe } from './pipes/jsonpath.pipe';
import { JsonpathQueryDirective } from './directives/jsonpath-query.directive';

// Initialize engine before bootstrapping
export function initializeApp(): () => Promise<void> {
  // Optional no-op initialization for API parity
  return () => JSONPath.init();
}

@NgModule({
  declarations: [
    JsonPathPipe,
    JsonpathQueryDirective
  ],
  providers: [
    JsonPathService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    }
  ],
  imports: [BrowserModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

## Best Practices

### 1. Initialize engine Early

```typescript
// Use APP_INITIALIZER as shown above
```

### 2. Use Services for Reusability

```typescript
// Centralize query logic in services
```

### 3. Leverage RxJS Operators

```typescript
// Use debounceTime, switchMap, shareReplay
```

### 4. Handle Errors Gracefully

```typescript
this.data$ = this.jsonPath.query(path, data).pipe(
  catchError(error => {
    console.error('Query error:', error);
    return of([]);
  })
);
```

## See Also

- [React Integration](./react.md) - React examples
- [Vue Integration](./vue.md) - Vue examples
- [API Reference](../api/index.md) - Complete API
