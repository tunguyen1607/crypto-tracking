import { Router, Request, Response } from 'express';
import middlewares from '../../../middlewares';
import { Container } from 'typedi';
import publish from '../../../../services/publish';
import producer from '../../../../services/producer';

export function info(req: Request, res: Response) {
  try {
    return res.json({ user: 'ok' }).status(200);
  } catch (error) {}
}
