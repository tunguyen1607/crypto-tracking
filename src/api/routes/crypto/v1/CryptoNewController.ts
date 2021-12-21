import { Request, Response } from 'express';
import { Container } from 'typedi';
import { promisify } from 'util';
import {Joi} from "celebrate";

export async function list(req: Request, res: Response) {
  try {
    const cryptoNewModel = Container.get('cryptoNewModel');
    // @ts-ignore
    let query: any = req.query;
    let {cryptoId, limit, page} = query;
    if(!page){
      page = 1;
    }
    if(!limit){
      limit = 100;
    }
    if(!cryptoId){
      throw new Error('not found cryptoId|400')
    }
    let filter = {
      cryptoId
    };
    let offset = (page - 1) * limit;
    // @ts-ignore
    let newList: any = await cryptoNewModel.findAll({
      offset: offset,
      limit: limit,
      where: filter,
      raw: true,
      attributes: ['cryptoId', 'title', 'subtitle', 'content', 'cover', 'slug', 'language', 'sourceName', 'sourceUrl', 'type', 'visibility', 'status', 'createdAt', 'updatedAt', 'releasedAt'],
      order: [
        ['releasedAt', 'DESC']
      ],
    });
    // @ts-ignore
    let count: any = await cryptoNewModel.count({
      where: filter,
    });
    return res.json({ data: newList, count: count}).status(200);
  } catch (error) {
    if (error.message && error.message.includes('|')) {
      const [message, code] = error.message.split('|');
      return res.json({ error: true, message }).status(code);
    }
    console.log(error);
    return res.json({ error: true, message: 'Something went wrong!' }).status(500);
  }
}
