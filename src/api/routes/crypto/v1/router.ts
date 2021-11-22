import middlewares from '../../../middlewares';
import * as cryptoCurrencyController from './CryptoCurrencyController';

export default route => {
  route.get('/info', [cryptoCurrencyController.info]);
};
