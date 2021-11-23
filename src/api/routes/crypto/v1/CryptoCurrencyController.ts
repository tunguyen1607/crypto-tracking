import { Request, Response } from 'express';
import { Container } from 'typedi';
import { promisify } from 'util';

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
    let cryptoDetail = await cryptoModel.findOne({
      where: findQuery,
      attributes: ['price', 'symbol', 'description', 'logo'],
    });
    if (!cryptoDetail || !cryptoDetail.symbol) {
      throw new Error('Not found crypto info|400');
    }
    let priceKey = cryptoDetail.symbol.toLowerCase() + '_current_price';
    cryptoDetail.price = await getAsync(priceKey);
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
