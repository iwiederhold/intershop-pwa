import { FormControl, FormGroup } from '@angular/forms';

import { AddressFormBusinessHelper } from '../address-form-business/address-form-business.helper';

export abstract class AddressFormFactory {
  countryCode = 'default';
  countryLabel = '';

  isBusinessCustomer = false;

  group(): FormGroup {
    return new FormGroup({});
  }

  // tslint:disable-next-line:no-any
  getGroup(param: { isBusinessAddress?: boolean; value?: { [key: string]: any } }): FormGroup {
    // get formGroup according to the country specific factory
    const newGroup = this.group();

    // add countryCode form controls
    newGroup.addControl('countryCode', new FormControl(''));

    if (param.isBusinessAddress) {
      AddressFormBusinessHelper.addControls(newGroup);
    }

    // apply values to the new form
    if (param.value) {
      newGroup.patchValue(param.value);
    }
    return newGroup;
  }
}
