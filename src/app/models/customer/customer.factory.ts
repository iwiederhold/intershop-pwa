import { FormGroup } from '@angular/forms';
import { UUID } from 'angular2-uuid';
import { AddressFactory } from '../address/address.factory';
import { CredentialsFactory } from '../credentials/credentials.factory';
import { FactoryHelper } from '../factory-helper';
import { CustomerData } from './customer.interface';
import { Customer } from './customer.model';


export class CustomerFactory {

  static fromData(data: CustomerData): Customer {
    const customer: Customer = new Customer();

    FactoryHelper.primitiveMapping<CustomerData, Customer>(data, customer);
    if (data.preferredShipToAddress) {
      customer.preferredShipToAddress = AddressFactory.fromData(data.preferredShipToAddress);
    }
    if (data.preferredInvoiceToAddress) {
      customer.preferredInvoiceToAddress = AddressFactory.fromData(data.preferredInvoiceToAddress);
    }
    if (data.credentials) {
      customer.credentials = CredentialsFactory.fromData(data.credentials);
    }
    if (data.address) {
      customer.address = AddressFactory.fromData(data.address);
    }
    return customer;
  }

  static fromForm(form: FormGroup) {
    if (!form) {
      return null;
    }

    const customer: Customer = new Customer();
    FactoryHelper.primitiveMapping<FormGroup, Customer>(form.value, customer);

    // create and assign a customer number; ToDo: customerNo should be generated by the server
    customer.customerNo = customer.customerNo || UUID.UUID();

    // create and assign a new credentials object
    if (form.get('credentials')) {
      customer.credentials = CredentialsFactory.fromForm(<FormGroup>form.get('credentials'));
      customer.email = customer.email || customer.credentials.login;
    }

    // create and assign a new address object
    if (form.get('address')) {
      customer.address = AddressFactory.fromForm(<FormGroup>form.get('address'));

      // copy address entries to the customer, if empty
      customer.firstName = customer.firstName || customer.address.firstName;
      customer.lastName = customer.lastName || customer.address.lastName;
      customer.phoneHome = customer.phoneHome || customer.address.phoneHome;
      if (customer.title || customer.address.title) {
        customer.title = customer.title || customer.address.title;
      }
    }
    return customer;
  }
}
