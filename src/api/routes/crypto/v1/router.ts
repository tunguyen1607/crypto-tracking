import middlewares from '../../../middlewares';
import * as cryptoCurrencyController from './CryptoCurrencyController';
import * as cryptoNewController from './CryptoNewController';
import * as cryptoMarketController from './CryptoMarketController';

export default route => {
  route.get('/info', [cryptoCurrencyController.info]);
  route.get('/list', [cryptoCurrencyController.list]);
  route.get('/historical', [cryptoCurrencyController.historical]);
  route.get('/exchange', [cryptoMarketController.exchangeDetail]);
  route.get('/exchanges', [cryptoMarketController.exchangeList]);
  route.get('/markets/info', [cryptoMarketController.pairDetail]);
  route.get('/markets', [cryptoMarketController.pairList]);
  route.get('/markets/chart', [cryptoMarketController.chart]);
  route.get('/markets/historical', [cryptoMarketController.historical]);
  route.get('/news', [cryptoNewController.list]);
};
