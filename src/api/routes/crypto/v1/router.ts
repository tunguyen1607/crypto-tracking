import middlewares from '../../../middlewares';
import * as cryptoCurrencyController from './CryptoCurrencyController';
import * as cryptoNewController from './CryptoNewController';

export default route => {
  route.get('/info', [cryptoCurrencyController.info]);
  route.get('/list', [cryptoCurrencyController.list]);
  route.get('/historical', [cryptoCurrencyController.historical]);
  route.get('/news', [cryptoNewController.list]);
};
