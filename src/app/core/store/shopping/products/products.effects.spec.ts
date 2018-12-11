import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, Store, StoreModule, combineReducers } from '@ngrx/store';
import { cold, hot } from 'jest-marbles';
import { RouteNavigation } from 'ngrx-router';
import { Observable, of, throwError } from 'rxjs';
import { anyNumber, anyString, anything, capture, instance, mock, verify, when } from 'ts-mockito';

import { ENDLESS_SCROLLING_ITEMS_PER_PAGE } from '../../../configurations/injection-keys';
import { HttpError } from '../../../models/http-error/http-error.model';
import { Locale } from '../../../models/locale/locale.model';
import { Product } from '../../../models/product/product.model';
import { ProductsService } from '../../../services/products/products.service';
import { SelectLocale, SetAvailableLocales } from '../../locale';
import { localeReducer } from '../../locale/locale.reducer';
import { shoppingReducers } from '../shopping-store.module';
import { ChangeSortBy, SetPage, SetPagingInfo, SetPagingLoading, SetSortKeys } from '../viewconf';

import * as fromActions from './products.actions';
import { ProductsEffects } from './products.effects';

describe('Products Effects', () => {
  let actions$: Observable<Action>;
  let effects: ProductsEffects;
  let store$: Store<{}>;
  let productsServiceMock: ProductsService;
  const DE_DE = { lang: 'de' } as Locale;
  const EN_US = { lang: 'en' } as Locale;

  const router = mock(Router);

  beforeEach(() => {
    productsServiceMock = mock(ProductsService);
    when(productsServiceMock.getProduct(anyString())).thenCall((sku: string) => {
      if (sku === 'invalid') {
        return throwError({ message: 'invalid' });
      } else {
        return of({ sku } as Product);
      }
    });

    when(productsServiceMock.getCategoryProducts('123', anyNumber(), anyNumber(), 'name-asc')).thenReturn(
      of({
        categoryUniqueId: '123',
        sortKeys: ['name-asc', 'name-desc'],
        products: [{ sku: 'P222' }, { sku: 'P333' }] as Product[],
        total: 2,
      })
    );

    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({
          shopping: combineReducers(shoppingReducers),
          locale: localeReducer,
        }),
      ],
      providers: [
        ProductsEffects,
        provideMockActions(() => actions$),
        { provide: ProductsService, useFactory: () => instance(productsServiceMock) },
        { provide: Router, useFactory: () => instance(router) },
        { provide: ENDLESS_SCROLLING_ITEMS_PER_PAGE, useValue: 3 },
      ],
    });

    effects = TestBed.get(ProductsEffects);
    store$ = TestBed.get(Store);

    store$.dispatch(new SetAvailableLocales([DE_DE]));
  });

  describe('loadProduct$', () => {
    it('should call the productsService for LoadProduct action', done => {
      const sku = 'P123';
      const action = new fromActions.LoadProduct(sku);
      actions$ = of(action);

      effects.loadProduct$.subscribe(() => {
        verify(productsServiceMock.getProduct(sku)).once();
        done();
      });
    });

    it('should map to action of type LoadProductSuccess', () => {
      const sku = 'P123';
      const action = new fromActions.LoadProduct(sku);
      const completion = new fromActions.LoadProductSuccess({ sku } as Product);
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadProduct$).toBeObservable(expected$);
    });

    it('should map invalid request to action of type LoadProductFail', () => {
      const sku = 'invalid';
      const action = new fromActions.LoadProduct(sku);
      const completion = new fromActions.LoadProductFail({ message: 'invalid' } as HttpError);
      actions$ = hot('-a-a-a', { a: action });
      const expected$ = cold('-c-c-c', { c: completion });

      expect(effects.loadProduct$).toBeObservable(expected$);
    });
  });

  describe('loadProductsForCategory$', () => {
    beforeEach(() => {
      store$.dispatch(new ChangeSortBy('name-asc'));
    });

    it('should call service for SKU list', done => {
      actions$ = of(new fromActions.LoadProductsForCategory('123'));

      effects.loadProductsForCategory$.subscribe(() => {
        verify(productsServiceMock.getCategoryProducts('123', anyNumber(), anyNumber(), 'name-asc')).once();
        done();
      });
    });

    it('should trigger actions of type SetProductSkusForCategory, SetSortKeys and LoadProductSuccess for each product in the list', () => {
      actions$ = hot('a', {
        a: new fromActions.LoadProductsForCategory('123'),
      });
      const expectedValues = {
        b: new SetPagingInfo({ currentPage: 0, totalItems: 2, newProducts: ['P222', 'P333'] }),
        c: new SetSortKeys(['name-asc', 'name-desc']),
        d: new fromActions.LoadProductSuccess({ sku: 'P222' } as Product),
        e: new fromActions.LoadProductSuccess({ sku: 'P333' } as Product),
      };
      expect(effects.loadProductsForCategory$).toBeObservable(cold('(bcde)', expectedValues));
    });

    it('should not die if repeating errors are encountered', () => {
      when(productsServiceMock.getCategoryProducts(anything(), anyNumber(), anyNumber(), anyString())).thenReturn(
        throwError({ message: 'ERROR' })
      );
      actions$ = hot('-a-a-a', {
        a: new fromActions.LoadProductsForCategory('123'),
      });
      expect(effects.loadProductsForCategory$).toBeObservable(
        cold('-a-a-a', { a: new fromActions.LoadProductFail({ message: 'ERROR' } as HttpError) })
      );
    });
  });

  describe('loadMoreProductsForCategory$', () => {
    it('should trigger if more products are available', () => {
      actions$ = hot('a', {
        a: new fromActions.LoadMoreProductsForCategory('123'),
      });
      const expectedValues = {
        a: new SetPagingLoading(),
        b: new SetPage(1),
        c: new fromActions.LoadProductsForCategory('123'),
      };
      expect(effects.loadMoreProductsForCategory$).toBeObservable(cold('(abc)', expectedValues));
    });
  });

  describe('routeListenerForSelectingProducts$', () => {
    it('should fire SelectProduct when route /category/XXX/product/YYY is navigated', () => {
      const action = new RouteNavigation({
        path: 'category/:categoryUniqueId/product/:sku',
        params: { categoryUniqueId: 'dummy', sku: 'foobar' },
        queryParams: {},
      });
      const expected = new fromActions.SelectProduct('foobar');

      actions$ = hot('a', { a: action });
      expect(effects.routeListenerForSelectingProducts$).toBeObservable(cold('a', { a: expected }));
    });

    it('should fire SelectProduct when route /product/YYY is navigated', () => {
      const action = new RouteNavigation({
        path: 'product/:sku',
        params: { sku: 'foobar' },
        queryParams: {},
      });
      const expected = new fromActions.SelectProduct('foobar');

      actions$ = hot('a', { a: action });
      expect(effects.routeListenerForSelectingProducts$).toBeObservable(cold('a', { a: expected }));
    });

    it('should not fire SelectProduct when route /something is navigated', () => {
      const action = new RouteNavigation({ path: 'something', params: {}, queryParams: {} });

      actions$ = hot('a', { a: action });
      expect(effects.routeListenerForSelectingProducts$).toBeObservable(cold('-'));
    });
  });

  describe('selectedProduct$', () => {
    it('should map to LoadProduct when product is selected', () => {
      const sku = 'P123';
      actions$ = hot('a', { a: new fromActions.SelectProduct(sku) });
      expect(effects.selectedProduct$).toBeObservable(cold('a', { a: new fromActions.LoadProduct(sku) }));
    });

    it('should fire LoadProduct when product is undefined', () => {
      actions$ = hot('a', { a: new fromActions.SelectProduct(undefined) });
      expect(effects.selectedProduct$).toBeObservable(cold('-'));
    });
  });

  describe('languageChange$', () => {
    it('should refetch product when language is changed distinctly', () => {
      const sku = 'P123';

      store$.dispatch(new fromActions.LoadProductSuccess({ sku } as Product));
      store$.dispatch(new fromActions.SelectProduct(sku));
      actions$ = hot('-a--a--b--b--a', { a: new SelectLocale(DE_DE), b: new SelectLocale(EN_US) });

      expect(effects.languageChange$).toBeObservable(cold('-a-----a-----a', { a: new fromActions.LoadProduct(sku) }));
    });
  });

  describe('redirectIfErrorInProducts$', () => {
    it('should redirect if triggered', done => {
      const action = new fromActions.LoadProductFail({ status: 404 } as HttpError);

      actions$ = of(action);

      effects.redirectIfErrorInProducts$.subscribe(() => {
        verify(router.navigate(anything())).once();
        const [param] = capture(router.navigate).last();
        expect(param).toEqual(['/error']);
        done();
      });
    });
  });
});