import middlewares from '../../../middlewares';
import * as cryptoCurrencyController from './CryptoCurrencyController';
import * as cryptoNewController from './CryptoNewController';
import * as cryptoMarketController from './CryptoMarketController';

export default route => {
  route.get('/info', [cryptoCurrencyController.info]);
  route.get('/list', [cryptoCurrencyController.list]);
  route.get('/historical', [cryptoCurrencyController.historical]);
  route.get('/pair', [cryptoMarketController.pairDetail]);
  route.get('/pairs', [cryptoMarketController.pairList]);
  route.get('/news', [cryptoNewController.list]);
};
