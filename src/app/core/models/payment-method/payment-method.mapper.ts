import { FormlyFieldConfig } from '@ngx-formly/core';

import { PriceMapper } from 'ish-core/models/price/price.mapper';

import { PaymentMethodBaseData, PaymentMethodData, PaymentMethodParameterType } from './payment-method.interface';
import { PaymentMethod } from './payment-method.model';

export class PaymentMethodMapper {
  static fromData(body: PaymentMethodData): PaymentMethod[] {
    if (!body || !body.data) {
      throw new Error(`'paymentMethodData' is required`);
    }

    const included = body.included;

    if (!body.data.length) {
      return [];
    }

    return body.data
      .filter(data => PaymentMethodMapper.isPaymentMethodValid(data))
      .map(data => ({
        id: data.id,
        serviceId: data.serviceID,
        displayName: data.displayName,
        description: data.description,
        capabilities: data.capabilities,
        isRestricted: data.restricted,
        restrictionCauses: data.restrictions,
        paymentCosts: PriceMapper.fromPriceItem(data.paymentCosts, 'net'),
        paymentCostsThreshold: PriceMapper.fromPriceItem(data.paymentCostsThreshold, 'net'),
        paymentInstruments:
          included && included.paymentInstruments && data.paymentInstruments
            ? data.paymentInstruments.map(id => included.paymentInstruments[id])
            : undefined,
        parameters: data.parameterDefinitions ? PaymentMethodMapper.mapParameter(data.parameterDefinitions) : undefined,
        hostedPaymentPageParameters: data.hostedPaymentPageParameters,
      }));
  }

  /**
   * determines if payment method is valid and is available
   * valid: payment methods without capabilities or which have no capabilities given in the list below
   */
  private static isPaymentMethodValid(paymentData: PaymentMethodBaseData): boolean {
    const invalidCapabilities = ['LimitedTender', 'FastCheckout'];

    // without capabilities
    if (!paymentData.capabilities || !paymentData.capabilities.length) {
      return true;
    }
    // excluded by the invalidCapabilities list
    return !paymentData.capabilities.some(data => invalidCapabilities.includes(data));
  }

  /**
   * maps form parameter if there are some (like credit card or direct debit)
   */
  private static mapParameter(parametersData: PaymentMethodParameterType[]): FormlyFieldConfig[] {
    return parametersData.map(p => {
      const param: FormlyFieldConfig = {
        key: p.name,
        type: p.options ? 'select' : 'input',
        templateOptions: {
          type: p.type === 'string' ? 'text' : (p.type as string).toLowerCase(),
          label: p.displayName,
          placeholder: p.description,
          defaultValue: '',
          options:
            p.options && p.options.length > 0
              ? p.options.map(option => ({ label: option.displayName, value: option.id }))
              : undefined,
          attributes: {},
        },
      };

      if (p.constraints) {
        if (p.constraints.required) {
          param.templateOptions.required = true;
          param.templateOptions.attributes.required = p.constraints.required.message;
        }
        if (p.constraints.size) {
          param.templateOptions.minLength = p.constraints.size.min;
          param.templateOptions.maxLength = p.constraints.size.max;
          param.templateOptions.attributes.minLength = p.constraints.size.message;
          param.templateOptions.attributes.maxLength = p.constraints.size.message;
        }
        if (p.constraints.pattern) {
          param.templateOptions.pattern = p.constraints.pattern.regexp;
          param.templateOptions.attributes.pattern = p.constraints.pattern.message;
        }
      }
      return param;
    });
  }
}
