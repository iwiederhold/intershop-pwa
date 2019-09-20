import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { combineReducers } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent, MockPipe } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { anything, instance, mock, when } from 'ts-mockito';

import { ShoppingFacade } from 'ish-core/facades/shopping.facade';
import { LineItemView } from 'ish-core/models/line-item/line-item.model';
import { PricePipe } from 'ish-core/models/price/price.pipe';
import { VariationProductView } from 'ish-core/models/product-view/product-view.model';
import { ProductCompletenessLevel } from 'ish-core/models/product/product.model';
import { shoppingReducers } from 'ish-core/store/shopping/shopping-store.module';
import { findAllIshElements } from 'ish-core/utils/dev/html-query-utils';
import { ngrxTesting } from 'ish-core/utils/dev/ngrx-testing';
import { LoadingComponent } from 'ish-shared/common/components/loading/loading.component';
import { InputComponent } from 'ish-shared/forms/components/input/input.component';
import { LineItemEditDialogComponent } from 'ish-shared/line-item/components/line-item-edit-dialog/line-item-edit-dialog.component';
import { ProductIdComponent } from 'ish-shared/product/components/product-id/product-id.component';
import { ProductInventoryComponent } from 'ish-shared/product/components/product-inventory/product-inventory.component';
import { ProductRowComponent } from 'ish-shared/product/components/product-row/product-row.component';
import { ProductTileComponent } from 'ish-shared/product/components/product-tile/product-tile.component';
import { ProductVariationSelectComponent } from 'ish-shared/product/components/product-variation-select/product-variation-select.component';
import { ProductImageComponent } from 'ish-shell/header/components/product-image/product-image.component';

import { LineItemEditDialogContainerComponent } from './line-item-edit-dialog.container';

describe('Line Item Edit Dialog Container', () => {
  let component: LineItemEditDialogContainerComponent;
  let fixture: ComponentFixture<LineItemEditDialogContainerComponent>;
  let element: HTMLElement;
  let shoppingFacadeMock: ShoppingFacade;

  beforeEach(async(() => {
    shoppingFacadeMock = mock(ShoppingFacade);

    TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        ngrxTesting({
          reducers: {
            shopping: combineReducers(shoppingReducers),
          },
        }),
      ],
      declarations: [
        LineItemEditDialogComponent,
        LineItemEditDialogContainerComponent,
        MockComponent(InputComponent),
        MockComponent(LoadingComponent),
        MockComponent(ProductIdComponent),
        MockComponent(ProductImageComponent),
        MockComponent(ProductInventoryComponent),
        MockComponent(ProductRowComponent),
        MockComponent(ProductTileComponent),
        MockComponent(ProductVariationSelectComponent),
        MockPipe(PricePipe),
      ],
      providers: [{ provide: ShoppingFacade, useFactory: () => instance(shoppingFacadeMock) }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineItemEditDialogContainerComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    component.lineItem = ({
      product: {
        type: 'VariationProduct',
        sku: 'SKU',
        variableVariationAttributes: [],
        availability: true,
        inStock: true,
        completenessLevel: ProductCompletenessLevel.List,
      },

      quantity: {
        value: 5,
      },
    } as unknown) as LineItemView;

    when(shoppingFacadeMock.product$(anything(), anything())).thenReturn(of(component.lineItem.product) as Observable<
      VariationProductView
    >);

    when(shoppingFacadeMock.productNotReady$(anything(), anything())).thenReturn(of(false));
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
    expect(element).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should give correct product id of variation to product id component', () => {
    fixture.detectChanges();
    expect(element.querySelector('ish-product-id')).toMatchInlineSnapshot(`<ish-product-id></ish-product-id>`);
  });

  it('should display ish-components on the container', () => {
    fixture.detectChanges();
    expect(findAllIshElements(element)).toIncludeAllMembers(['ish-input', 'ish-product-image']);
  });

  it('should display loading-components on the container', () => {
    when(shoppingFacadeMock.productNotReady$(anything(), anything())).thenReturn(of(true));
    fixture.detectChanges();
    expect(findAllIshElements(element)).toIncludeAllMembers(['ish-input', 'ish-loading']);
  });
});
