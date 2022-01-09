import { Request, Response } from 'express';
import { Container } from 'typedi';
import { promisify } from 'util';
import {Joi} from "celebrate";

export async function pairDetail(req: Request, res: Response) {
  try {
    const cryptoPairModel = Container.get('CryptoPairModel');
    const RedisInstance = Container.get('redisInstance');
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const sMembersAsync = promisify(RedisInstance.smembers).bind(RedisInstance);
    let query: any = req.query;
    if (!query.id && !query.symbol) {
      throw new Error('Not found id or symbol|400');
    }
    let findQuery = {};
    if (query.id) {
      findQuery['id'] = query.id;
    }
    if (query.symbol) {
      findQuery['symbol'] = query.symbol.toUpperCase();
    }
    // @ts-ignore
    let cryptoDetail: any = await cryptoPairModel.findOne({
      where: findQuery,
      raw: true,
    });
    if (!cryptoDetail || !cryptoDetail.symbol) {
      throw new Error('Not found crypto info|400');
    }
    let priceKey = 'binance:trade:'+cryptoDetail.symbol.toLowerCase();
    let priceObject = await getAsync(priceKey);
    let priceTicker = await getAsync('binance:ticker:'+cryptoDetail.symbol.toLowerCase());
    if(priceObject){
      priceObject = JSON.parse(priceObject);
      priceTicker = JSON.parse(priceTicker);
      cryptoDetail.price = parseFloat(priceObject['price']);
      cryptoDetail['quote'] = priceObject;
      let priceHistories = await sMembersAsync('binance:24hPrice:'+cryptoDetail.symbol.toLowerCase());
      let priceLast24h = JSON.parse(priceHistories[0]);
      cryptoDetail['priceChange'] = parseFloat(priceObject['price']) - parseFloat(priceLast24h.p);
      cryptoDetail['priceChangePercent'] = (cryptoDetail['priceChange'] / parseFloat(priceLast24h.p)) * 100;
      cryptoDetail['volume'] = parseFloat(priceTicker['volume'])
      cryptoDetail['quoteVolume'] = parseFloat(priceTicker['quoteVolume'])
    }
    return res.json({ data: cryptoDetail }).status(200);
  } catch (error) {
    if (error.message && error.message.includes('|')) {
      const [message, code] = error.message.split('|');
      return res.json({ error: true, message }).status(code);
    }
    console.log(error);
    return res.json({ error: true, message: 'Something went wrong!' }).status(500);
  }
}

export async function pairList(req: Request, res: Response) {
  try {
    const cryptoPairModel = Container.get('CryptoPairModel');
    const RedisInstance = Container.get('redisInstance');
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const sMembersAsync = promisify(RedisInstance.smembers).bind(RedisInstance);
    let query: any = req.query;
    let {market, marketStatus, limit, page} = query;
    if(!page){
      page = 1;
    }
    if(!limit){
      limit = 100;
    }
    let filter = {};
    let offset = (page - 1) * limit;
    if(market){
      filter['market'] = market;
    }
    if(marketStatus){
      filter['marketStatus'] = marketStatus;
    }
    // @ts-ignore
    let cryptoList: any = await cryptoPairModel.findAll({
      offset: offset,
      limit: limit,
      where: filter,
      raw: true,
      attributes: ['id', 'symbol', 'baseAsset', 'quoteAsset', 'status', 'market', 'statusMarket', 'lastUpdate'],
    });
    // @ts-ignore
    let count: any = await cryptoPairModel.count({
      where: filter,
    });
    let start = Date.now();
    for (let i = 0; i < cryptoList.length; i++){
      let item = cryptoList[i];
      let priceKey = 'binance:ticker:'+item.symbol.toLowerCase();
      let priceObject = await getAsync(priceKey);
      if(priceObject){
        priceObject = JSON.parse(priceObject);
        priceObject['price'] = parseFloat(priceObject['lastPrice']);
        item.price = parseFloat(priceObject['lastPrice']);
        item['priceChange'] = parseFloat(priceObject['priceChange']);
        item['priceChangePercent'] = parseFloat(priceObject['priceChangePercent']);
        item['volume'] = parseFloat(priceObject['volume'])
        item['quoteVolume'] = parseFloat(priceObject['quoteVolume'])
        item['quote'] = priceObject;
      }
      cryptoList[i] = item;
    }
    let end = Date.now();
    console.log(end - start)
    return res.json({ data: cryptoList, count: count}).status(200);
  } catch (error) {
    if (error.message && error.message.includes('|')) {
      const [message, code] = error.message.split('|');
      return res.json({ error: true, message }).status(code);
    }
    console.log(error);
    return res.json({ error: true, message: 'Something went wrong!' }).status(500);
  }
}

export async function historical(req: Request, res: Response) {
  try {
    const cryptoHistoricalModel = Container.get('cryptoHistoricalModel');
    // @ts-ignore
    let query: any = req.query;
    let {limit, page, cryptoId} = query;
    if(!page){
      page = 1;
    }
    if(!limit){
      limit = 100;
    }
    if(!cryptoId){
      throw new Error('not found cryptoId|400')
    }
    let filter = {};
    let offset = (page - 1) * limit;
    // @ts-ignore
    let historicalList: any = await cryptoHistoricalModel.findAll({
      offset: offset,
      limit: limit,
      where: filter,
      raw: true,
      attributes: ['id', 'cryptoId', 'sourceId', 'date', 'timestamp', 'timeOpen', 'priceOpen', 'timeHigh', 'priceHigh', 'timeLow', 'priceLow', 'timeClose', 'priceClose', 'volume', 'marketCap', 'status'],
      order: [
        ['timestamp', 'DESC'],
        ['date', 'DESC'],
      ],
    });
    // @ts-ignore
    let count: any = await cryptoHistoricalModel.count({
      where: filter,
    });
    return res.json({ data: historicalList, count: count}).status(200);
  } catch (error) {
    if (error.message && error.message.includes('|')) {
      const [message, code] = error.message.split('|');
      return res.json({ error: true, message }).status(code);
    }
    console.log(error);
    return res.json({ error: true, message: 'Something went wrong!' }).status(500);
  }
}

export async function chart(req: Request, res: Response) {
  try {
    const cryptoHistoricalTimeModel = Container.get('cryptoHistoricalTimeModel');
    // @ts-ignore
    let query: any = req.query;
    let {cryptoId, range} = query;
    if(!cryptoId){
      throw new Error('not found cryptoId|400')
    }
    if(!range){
      range = '1d';
    }
    let filter = {};
    switch (range) {
      case '1h':

        break;
      case '1d':
        break;
      case '7d':
        break;
      case '1m':
        break;
      case '3m':
        break;
      case '1y':
        break;
      case 'ytd':
        break;
      case 'all':
        break;
    }
    // @ts-ignore
    let historicalList: any = await cryptoHistoricalTimeModel.findAll({
      where: filter,
      raw: true,
      order: [
        ['timestamp', 'DESC'],
        ['date', 'DESC'],
      ],
    });
    return res.json({ data: historicalList}).status(200);
  } catch (error) {
    if (error.message && error.message.includes('|')) {
      const [message, code] = error.message.split('|');
      return res.json({ error: true, message }).status(code);
    }
    console.log(error);
    return res.json({ error: true, message: 'Something went wrong!' }).status(500);
  }
}
