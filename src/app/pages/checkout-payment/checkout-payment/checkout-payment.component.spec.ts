import { ChangeDetectionStrategy, Component, SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { FormlyForm } from '@ngx-formly/core';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent, MockDirective, MockPipe } from 'ng-mocks';

import { ServerHtmlDirective } from 'ish-core/directives/server-html.directive';
import { HttpError } from 'ish-core/models/http-error/http-error.model';
import { PricePipe } from 'ish-core/models/price/price.pipe';
import { BasketMockData } from 'ish-core/utils/dev/basket-mock-data';
import { ContentIncludeComponent } from 'ish-shared/cms/components/content-include/content-include.component';
import { BasketAddressSummaryComponent } from 'ish-shared/components/basket/basket-address-summary/basket-address-summary.component';
import { BasketCostSummaryComponent } from 'ish-shared/components/basket/basket-cost-summary/basket-cost-summary.component';
import { BasketItemsSummaryComponent } from 'ish-shared/components/basket/basket-items-summary/basket-items-summary.component';
import { BasketPromotionCodeComponent } from 'ish-shared/components/basket/basket-promotion-code/basket-promotion-code.component';
import { BasketValidationResultsComponent } from 'ish-shared/components/basket/basket-validation-results/basket-validation-results.component';
import { ErrorMessageComponent } from 'ish-shared/components/common/error-message/error-message.component';
import { ModalDialogLinkComponent } from 'ish-shared/components/common/modal-dialog-link/modal-dialog-link.component';

import { PaymentConcardisCreditcardComponent } from '../payment-concardis-creditcard/payment-concardis-creditcard.component';

import { CheckoutPaymentComponent } from './checkout-payment.component';

describe('Checkout Payment Component', () => {
  let component: CheckoutPaymentComponent;
  let fixture: ComponentFixture<CheckoutPaymentComponent>;
  let element: HTMLElement;
  let paymentMethodChange: SimpleChanges;

  beforeEach(async(() => {
    @Component({ template: 'dummy' })
    class DummyComponent {}

    TestBed.configureTestingModule({
      declarations: [
        CheckoutPaymentComponent,
        DummyComponent,
        MockComponent(BasketAddressSummaryComponent),
        MockComponent(BasketCostSummaryComponent),
        MockComponent(BasketItemsSummaryComponent),
        MockComponent(BasketPromotionCodeComponent),
        MockComponent(BasketValidationResultsComponent),
        MockComponent(ContentIncludeComponent),
        MockComponent(ErrorMessageComponent),
        MockComponent(FormlyForm),
        MockComponent(ModalDialogLinkComponent),
        MockComponent(NgbCollapse),
        MockComponent(PaymentConcardisCreditcardComponent),
        MockDirective(ServerHtmlDirective),
        MockPipe(PricePipe),
      ],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([{ path: 'checkout/review', component: DummyComponent }]),
        TranslateModule.forRoot(),
      ],
    })
      .overrideComponent(CheckoutPaymentComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutPaymentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    component.basket = BasketMockData.getBasket();
    component.paymentMethods = [
      {
        id: 'ISH_INVOICE',
        serviceId: 'ISH_INVOICE',
        displayName: 'Invoice',
      },
      {
        id: 'Concardis_CreditCard',
        serviceId: 'Concardis_CreditCard',
        displayName: 'Concardis Credit Card',
      },
      BasketMockData.getPaymentMethod(),
    ];
    paymentMethodChange = {
      paymentMethods: new SimpleChange(undefined, component.paymentMethods, false),
    };

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
    expect(element).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render available payment methods on page', () => {
    component.ngOnChanges(paymentMethodChange);
    fixture.detectChanges();
    expect(element.querySelector('#payment-accordion')).toBeTruthy();
  });

  it('should throw updatePaymentMethod event when the user changes payment selection', done => {
    fixture.detectChanges();

    component.updatePaymentMethod.subscribe(formValue => {
      expect(formValue).toBe('testPayment');
      done();
    });

    component.paymentForm.get('name').setValue('testPayment');
  });

  describe('error display', () => {
    it('should not render an error if no error occurs', () => {
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"]')).toBeFalsy();
    });

    it('should render an error if an error occurs', () => {
      component.error = { status: 404 } as HttpError;
      fixture.detectChanges();
      expect(element.querySelector('ish-error-message')).toBeTruthy();
    });

    it('should not render an error if the user has currently no payment method selected', () => {
      component.basket.payment = undefined;
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"]')).toBeFalsy();
    });

    it('should render an error if the user clicks next and has currently no payment method selected', () => {
      component.basket.payment = undefined;
      component.goToNextStep();
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"]')).toBeTruthy();
    });
  });

  describe('next button', () => {
    it('should set submitted if next button is clicked', () => {
      expect(component.nextSubmitted).toBeFalse();
      component.goToNextStep();
      expect(component.nextSubmitted).toBeTrue();
    });

    it('should not disable next button if basket payment method is set and next button is clicked', () => {
      expect(component.nextDisabled).toBeFalse();
      component.goToNextStep();
      expect(component.nextDisabled).toBeFalse();
    });

    it('should disable next button if basket payment method is missing and next button is clicked', () => {
      component.basket.payment = undefined;

      component.goToNextStep();
      expect(component.nextDisabled).toBeTrue();
    });
  });

  describe('parameter forms', () => {
    it('should open and close payment form if open/cancel form is triggered', () => {
      expect(component.formIsOpen(-1)).toBeTrue();
      component.openPaymentParameterForm(2);
      expect(component.formIsOpen(2)).toBeTrue();

      component.cancelNewPaymentInstrument();
      expect(component.formIsOpen(-1)).toBeTrue();
    });

    it('should throw createPaymentInstrument event when the user submits a valid parameter form', done => {
      component.ngOnChanges(paymentMethodChange);
      component.openPaymentParameterForm(2);

      component.createPaymentInstrument.subscribe(formValue => {
        expect(formValue).toEqual({ paymentMethod: 'ISH_CreditCard', parameters: [{ name: 'IBAN', value: 'DE123' }] });
        done();
      });

      component.parameterForm.addControl('IBAN', new FormControl('DE123', Validators.required));
      component.submitParameterForm();
    });

    it('should disable submit button when the user submits an invalid parameter form', () => {
      component.openPaymentParameterForm(1);
      fixture.detectChanges();

      expect(component.formSubmitted).toBeFalse();
      component.parameterForm.addControl('IBAN', new FormControl('', Validators.required));
      component.submitParameterForm();
      expect(component.formSubmitted).toBeTrue();
    });

    it('should render standard parameter form for standard parametrized form', () => {
      component.openPaymentParameterForm(2);

      component.ngOnChanges(paymentMethodChange);
      fixture.detectChanges();
      expect(element.querySelector('formly-form')).toBeTruthy();
      expect(element.querySelector('ish-payment-concardis-creditcard')).toBeFalsy();
    });
  });

  describe('should display selectable and deleteable payment instruments for parametrized payment methods', () => {
    it('should display payment instruments when parametrized payment methods are available', () => {
      component.ngOnChanges(paymentMethodChange);
      fixture.detectChanges();

      expect(element.querySelector('[data-testing-id=payment-parameter-form-ISH_CreditCard]')).toBeTruthy();
      expect(
        element.querySelector('[data-testing-id=payment-parameter-form-ISH_CreditCard] input[type=radio]')
      ).toBeTruthy();
      expect(element.querySelector('[data-testing-id=payment-parameter-form-ISH_CreditCard] a')).toBeTruthy();
    });

    it('should throw deletePaymentInstrument event when the user deletes a payment instrument', done => {
      const id = 'paymentInstrumentId';

      fixture.detectChanges();

      component.deletePaymentInstrument.subscribe(paymentInstrumentId => {
        expect(paymentInstrumentId).toEqual(id);
        done();
      });
      component.deleteBasketPayment(id);
    });
  });
});
