import { Router, Request, Response } from 'express';
import middlewares from '../middlewares';
import { Container } from 'typedi';
import sequelize from 'sequelize';
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
    let rs = await campaignModel.findAll({
      attributes: [[sequelize.fn('COUNT', sequelize.col('hats')), 'no_hats']],
    });
    return res.json({ rs: rs }).status(200);
  });
};
