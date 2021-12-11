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
      attributes: ['price', 'symbol', 'description', 'logo'],
    });
    console.log(cryptoDetail);
    if (!cryptoDetail || !cryptoDetail.symbol) {
      throw new Error('Not found crypto info|400');
    }
    let priceKey = cryptoDetail.symbol.toLowerCase() +'_to_usdt';
    let priceObject = await getAsync(priceKey);
    console.log(priceKey);
    console.log(priceObject);
    if(priceObject){
      priceObject = JSON.parse(priceObject);
      cryptoDetail.price = priceObject['price'];
      cryptoDetail['usdt'] = priceObject;
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
      attributes: ['id', 'price', 'symbol', 'description', 'logo', 'dateAdded', 'lastUpdated', 'volume', 'sourceId', 'source', 'slug', 'category', 'marketDominance', 'circulatingSupply', 'maxSupply', 'totalSupply', 'cmcRank', 'marketCap', 'market', 'statusMarket'],
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
      if(priceObject){
        priceObject = JSON.parse(priceObject);
        item.price = priceObject['price'];
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
