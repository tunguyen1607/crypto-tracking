import { Router, Request, Response } from 'express';
import middlewares from '../middlewares';
import { Container } from 'typedi';
import publish from '../../services/publish';
import producer from '../../services/producer';
import {promisify} from "util";
const route = Router();

export default (app: Router) => {
  app.use('/users', route);

  route.get('/me', middlewares.isAuth, middlewares.attachCurrentUser, (req: Request, res: Response) => {
    return res.json({ user: req.currentUser }).status(200);
  });

  route.get('/test', async (req: Request, res: Response) => {
    const logger = Container.get('logger');
    const RedisInstance = Container.get('redisInstance');
    // @ts-ignore
    const getAsync = promisify(RedisInstance.get).bind(RedisInstance);
    // @ts-ignore
    const sMembersAsync = promisify(RedisInstance.smembers).bind(RedisInstance);
    let priceKey = 'ftx:trade:btcusd';
    let priceTickerKey = 'ftx:ticker:btcusd';
    let priceTicker = await getAsync(priceTickerKey);
    let priceObject = await getAsync(priceKey);
    let price24H = await sMembersAsync('ftx:24hPrice:btcusd');
    return res.json({ rs: priceObject, hours: price24H, ticker: priceTicker}).status(200);
  });

  route.get('/testProducer', async (req: Request, res: Response) => {
    const logger = Container.get('logger');
    const producerService = Container.get(publish);
    let rs = await producerService.publish('', 'crypto_ftx_handle_list_pair', req.query);
    return res.json({ rs: rs }).status(200);
  });

  route.get('/testProducerKafka', async (req: Request, res: Response) => {
    const logger = Container.get('logger');
    const producerService = Container.get(producer);
    let rs = await producerService.send('BinanceLivePriceCoinConsumer', req.query);
    return res.json({ rs: rs }).status(200);
  });

  route.get('/testProducerBull', async (req: Request, res: Response) => {
    const logger = Container.get('logger');
    const producerService = Container.get('jobLiveMarketPairFTX');
    // @ts-ignore
    let rs = await producerService.add(req.query);
    return res.json({ rs: rs }).status(200);
  });
};
