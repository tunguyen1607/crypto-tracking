import { Request, Response } from 'express';
import { Container } from 'typedi';
import { promisify } from 'util';
import {Joi} from "celebrate";

export async function exchangeDetail(req: Request, res: Response) {
  try {
    const cryptoExchangeModel = Container.get('cryptoExchangeModel');
    let query: any = req.query;
    if (!query.id && !query.slug) {
      throw new Error('Not found id or slug|400');
    }
    let findQuery = {};
    if (query.id) {
      findQuery['id'] = query.id;
    }
    if (query.slug) {
      findQuery['slug'] = query.slug.toLowerCase();
    }
    // @ts-ignore
    let cryptoDetail: any = await cryptoExchangeModel.findOne({
      where: findQuery,
      raw: true,
    });
    if (!cryptoDetail || !cryptoDetail.name) {
      throw new Error('Not found exchange info|400');
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

export async function exchangeList(req: Request, res: Response) {
  try {
    const cryptoExchangeModel = Container.get('cryptoExchangeModel');
    let query: any = req.query;
    let {status, limit, page} = query;
    if(!page){
      page = 1;
    }
    if(!limit){
      limit = 100;
    }
    let filter = {};
    let offset = (page - 1) * limit;
    if(status){
      filter['status'] = status;
    }
    // @ts-ignore
    let exchangeList: any = await cryptoExchangeModel.findAll({
      where: filter,
      offset,
      limit,
      raw: true,
    });
    return res.json({ data: exchangeList }).status(200);
  } catch (error) {
    if (error.message && error.message.includes('|')) {
      const [message, code] = error.message.split('|');
      return res.json({ error: true, message }).status(code);
    }
    console.log(error);
    return res.json({ error: true, message: 'Something went wrong!' }).status(500);
  }
}

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
    let priceKey = cryptoDetail.market+':trade:'+cryptoDetail.symbol.toLowerCase();
    let priceObject = await getAsync(priceKey);
    let priceTicker = await getAsync(cryptoDetail.market+':ticker:'+cryptoDetail.symbol.toLowerCase());
    if(priceObject){
      priceObject = JSON.parse(priceObject);
      cryptoDetail.price = parseFloat(priceObject['price']);
      cryptoDetail['quote'] = priceObject;
      if(priceTicker){
        priceTicker = JSON.parse(priceTicker);
        cryptoDetail['priceChange'] = priceTicker['priceChange'];
        cryptoDetail['priceChangePercent'] = priceTicker['priceChangePercent'];
        cryptoDetail['baseVolume'] = priceTicker['volume'];
        cryptoDetail['quoteVolume'] = priceTicker['quoteVolume'];
      }
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
      let priceKey = item.market+':ticker:'+item.symbol.toLowerCase();
      let priceObject = await getAsync(priceKey);
      if(priceObject){
        priceObject = JSON.parse(priceObject);
        priceObject['price'] = priceObject['lastPrice'];
        item.price = priceObject['lastPrice'];
        item['priceChange'] = priceObject['priceChange'];
        item['priceChangePercent'] = priceObject['priceChangePercent'];
        item['baseVolume'] = priceObject['volume'];
        item['quoteVolume'] = priceObject['quoteVolume'];
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
    const cryptoMarketPairHistorical = Container.get('CryptoPairHistoricalTimeModel');
    // @ts-ignore
    let query: any = req.query;
    let {limit, page, marketPairId, symbol, exchangeId} = query;
    if(!page){
      page = 1;
    }
    if(!limit){
      limit = 100;
    }
    if(!exchangeId){
      throw new Error('not found exchangeId|400')
    }
    if(!marketPairId || !symbol){
      throw new Error('not found pairId or symbol|400')
    }
    let filter = {};
    if(marketPairId){
      filter['marketPairId'] = marketPairId
    }
    if(symbol){
      filter['symbol'] = symbol
    }
    let offset = (page - 1) * limit;
    // @ts-ignore
    let historicalList: any = await cryptoMarketPairHistorical.findAll({
      offset: offset,
      limit: limit,
      where: filter,
      raw: true,
      attributes: ['id', 'marketPairId', 'exchangeId', 'date', 'timestamp', 'timeOpen', 'priceOpen', 'timeHigh', 'priceHigh', 'timeLow', 'priceLow', 'timeClose', 'priceClose', 'baseVolume', 'baseAsset', 'quoteAsset'],
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
    const cryptoPairHistoricalTimeModel = Container.get('CryptoPairHistoricalTimeModel');
    // @ts-ignore
    let query: any = req.query;
    let {symbol, exchangeId, range} = query;
    if(!symbol){
      throw new Error('not found cryptoId|400')
    }
    if(!range){
      range = '4h';
    }
    let typeArr = [
      '1d', '1w', '1M', '3m', '5m', '15m', '30m', '4h', '6h', '8h', '12h', '1h', '1m'
    ];
    let filter = {
      symbol,
      exchangeId
    };
    if(typeArr.indexOf(range) < 0){
      throw new Error('wrong type range|400')
    }
    // @ts-ignore
    let historicalList: any = await cryptoPairHistoricalTimeModel.findAll({
      where: filter,
      raw: true,
      order: [
        ['timestamp', 'DESC'],
        ['datetime', 'DESC'],
      ],
      limit: 400
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
