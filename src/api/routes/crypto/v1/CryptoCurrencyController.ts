import { Request, Response } from 'express';
import { Container } from 'typedi';
import { promisify } from 'util';
import {Joi} from "celebrate";

export async function info(req: Request, res: Response) {
  try {
    const cryptoModel = Container.get('cryptoModel');
    const RedisInstance = Container.get('redisInstance');
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
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
    let cryptoDetail: any = await cryptoModel.findOne({
      where: findQuery,
      raw: true,
    });
    if (!cryptoDetail || !cryptoDetail.symbol) {
      throw new Error('Not found crypto info|400');
    }
    let priceKey = cryptoDetail.symbol.toLowerCase() +'_to_usdt';
    let priceObject = await getAsync(priceKey);
    if(priceObject){
      priceObject = JSON.parse(priceObject);
      cryptoDetail.price = priceObject['price'];
      cryptoDetail['quote'] = priceObject;
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

export async function list(req: Request, res: Response) {
  try {
    const cryptoModel = Container.get('cryptoModel');
    const RedisInstance = Container.get('redisInstance');
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
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
    let cryptoList: any = await cryptoModel.findAll({
      offset: offset,
      limit: limit,
      where: filter,
      raw: true,
      attributes: ['id', 'price', 'symbol', 'description', 'logo', 'dateAdded', 'lastUpdated', 'volume', 'sourceId', 'source', 'slug', 'category', 'marketDominance', 'circulatingSupply', 'maxSupply', 'totalSupply', 'rank', 'marketCap', 'market', 'statusMarket'],
      order: [
        ['rank', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    // @ts-ignore
    let count: any = await cryptoModel.count({
      where: filter,
    });
    let start = Date.now();
    for (let i = 0; i < cryptoList.length; i++){
      let item = cryptoList[i];
      let priceKey = item.symbol.toLowerCase() +'_to_usdt';
      let priceObject = await getAsync(priceKey);
      let priceHistories = await getAsync(priceKey+'_1h');
      if(priceObject){
        priceObject = JSON.parse(priceObject);
        priceHistories = JSON.parse(priceHistories);
        item.price = priceObject['price'];
        item['quote'] = priceObject;
        item['recent_1h'] = priceHistories;
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
