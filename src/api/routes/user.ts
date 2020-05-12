import { Router, Request, Response } from 'express';
import middlewares from '../middlewares';
import { Container } from 'typedi';
import producer from '../../services/producer';
const route = Router();

export default (app: Router) => {
  app.use('/users', route);

  route.get('/me', middlewares.isAuth, middlewares.attachCurrentUser, (req: Request, res: Response) => {
    return res.json({ user: req.currentUser }).status(200);
  });

  route.get('/test', async (req: Request, res: Response) => {
    const logger = Container.get('logger');
    const campaignModel = Container.get('campaignModel');
    // @ts-ignore
    let rs = await campaignModel.findAll();
    return res.json({ rs: rs }).status(200);
  });

  route.get('/testProducer', async (req: Request, res: Response) => {
    const logger = Container.get('logger');
    const producerService = Container.get(producer);
    let rs = await producerService.send('testProducer', req.query);
    return res.json({ rs: rs }).status(200);
  });
};
