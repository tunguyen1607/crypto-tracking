const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: 'eUCrfqLYRLcY8JofQpK8BzP1Pci1eNYW9i0fPIAzjSLDrRNq9HQ0KgIK6s70RNZY',
  APISECRET: 'oLn8mDkkbX6sWNPpRBCWckZXjm8LD3wvfq1FAR3cLV8Sh7YXMRwWDpUFGxgoUFpa'
});
async function run() {
  binance.candlesticks("BNBBTC", "5m", (error, ticks, symbol) => {
    console.info("candlesticks()", ticks);
    let last_tick = ticks[ticks.length - 1];
    let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
    console.info(symbol+" last close: "+close);
  }, {limit: 500, endTime: 1514764800000});
}
run();
