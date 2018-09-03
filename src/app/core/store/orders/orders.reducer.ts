import { EntityState, createEntityAdapter } from '@ngrx/entity';

import { BasketAction, BasketActionTypes } from '../../../checkout/store/basket';
import { HttpError } from '../../../models/http-error/http-error.model';
import { Order } from '../../../models/order/order.model';

import { OrdersAction, OrdersActionTypes } from './orders.actions';

export const orderAdapter = createEntityAdapter<Order>({
  selectId: order => order.id,
});

export interface OrdersState extends EntityState<Order> {
  loading: boolean;
  selected: string;
  error: HttpError;
}

export const initialState: OrdersState = orderAdapter.getInitialState({
  loading: false,
  selected: undefined,
  error: undefined,
});

export function ordersReducer(state = initialState, action: OrdersAction | BasketAction): OrdersState {
  switch (action.type) {
    case OrdersActionTypes.SelectOrder: {
      return {
        ...state,
        selected: action.payload,
      };
    }

    case BasketActionTypes.CreateOrderSuccess: {
      const payload = action.payload;

      return {
        ...orderAdapter.addOne(payload, state),
        selected: action.payload.id,
      };
    }

    case OrdersActionTypes.LoadOrders: {
      return {
        ...state,
        loading: true,
      };
    }

    case OrdersActionTypes.LoadOrdersFail: {
      const error = action.payload;
      return {
        ...state,
        error: error,
        loading: false,
      };
    }

    case OrdersActionTypes.LoadOrdersSuccess: {
      const loadedOrders = action.payload;
      return {
        ...orderAdapter.addAll(loadedOrders, state),
        loading: false,
      };
    }

    case OrdersActionTypes.ResetOrders: {
      return initialState;
    }
  }

  return state;
}