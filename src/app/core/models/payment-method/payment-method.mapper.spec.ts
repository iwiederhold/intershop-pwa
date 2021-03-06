import { PaymentMethodData, PaymentMethodParameterType } from './payment-method.interface';
import { PaymentMethodMapper } from './payment-method.mapper';

describe('Payment Method Mapper', () => {
  describe('fromData', () => {
    const paymentMethodData = {
      data: [
        {
          id: 'ISH_CreditCard',
          serviceID: 'ISH_CreditCard',
          displayName: 'Credit Card',
          paymentCosts: {
            net: {
              value: 40.34,
              currency: 'USD',
            },
            gross: {
              value: 40.34,
              currency: 'USD',
            },
          },
          paymentInstruments: ['12345'],
          paymentCostsThreshold: {
            net: {
              value: 40.34,
              currency: 'USD',
            },
            gross: {
              value: 40.34,
              currency: 'USD',
            },
          },
          restricted: false,
        },
      ],
      included: {
        paymentInstruments: { 12345: { id: 'ISH_CreditCard' } },
      },
    } as PaymentMethodData;

    const regexp = '^[A-Z]{2}[0-9]{2}([- ]{0,1}[0-9A-Z]{4}){4}[- 0-9A-Z]{0,4}';
    const parametersData: PaymentMethodParameterType[] = [
      {
        constraints: {
          required: {
            message: 'The name of the account holder is missing.',
          },
        },

        displayName: 'Account Holder',
        hidden: false,
        name: 'holder',
        type: 'string',
      },
      {
        constraints: {
          required: {
            message: 'The IBAN is required.',
          },

          size: {
            min: 15,
            max: 34,
            message: 'The IBAN must have a length of 15 to 34 characters.',
          },

          pattern: {
            regexp,
            message: 'The IBAN structure is invalid.',
          },
        },

        displayName: 'IBAN',
        hidden: false,
        name: 'IBAN',
        type: 'string',
      },
      {
        displayName: 'BIC',
        hidden: false,
        name: 'BIC',
        type: 'string',
      },
    ];

    it(`should return PaymentMethod when getting a PaymentMethodData`, () => {
      const paymentMethod = PaymentMethodMapper.fromData(paymentMethodData)[0];

      expect(paymentMethod).toBeTruthy();
      expect(paymentMethod.id).toEqual('ISH_CreditCard');
      expect(paymentMethod.paymentCosts.value).toBePositive();
      expect(paymentMethod.paymentCostsThreshold.value).toBePositive();
      expect(paymentMethod.isRestricted).toBeFalse();
    });

    it(`should return a restricted PaymentMethod when getting restricted PaymentMethodData`, () => {
      paymentMethodData.data[0].restricted = true;
      paymentMethodData.data[0].restrictions = [
        {
          message: 'restricition message',
          code: 'restricition code',
        },
      ];
      const paymentMethod = PaymentMethodMapper.fromData(paymentMethodData)[0];
      expect(paymentMethod.isRestricted).toBeTrue();
      expect(paymentMethod.restrictionCauses).toHaveLength(1);
    });

    it(`should return a payment method with parameter definitions if payment method has input parameters`, () => {
      paymentMethodData.data[0].parameterDefinitions = parametersData;
      const paymentMethod = PaymentMethodMapper.fromData(paymentMethodData)[0];

      expect(paymentMethod.parameters).toHaveLength(3);
      expect(paymentMethod.parameters[0].type).toEqual('input');
      expect(paymentMethod.parameters[0].key).toEqual('holder');
      expect(paymentMethod.parameters[0].templateOptions.type).toEqual('text');
      expect(paymentMethod.parameters[0].templateOptions.required).toBeTrue();

      expect(paymentMethod.parameters[1].templateOptions.pattern).toBe(regexp);
      expect(paymentMethod.parameters[1].templateOptions.minLength).toBe(15);
      expect(paymentMethod.parameters[1].templateOptions.maxLength).toBe(34);
      expect(paymentMethod.parameters[1].templateOptions.attributes).toBeObject();
    });
  });
});
