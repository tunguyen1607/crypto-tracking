import { Service, Inject } from 'typedi';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import axios from "axios";

@Service()
export default class BinanceService {
  constructor(
      @Inject('logger') private logger,
      @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async exchangeInfo(){
    let linkToCall = `https://api.binance.com/api/v3/exchangeInfo`;
    console.log(linkToCall);
    const result = await axios({
      method: 'GET',
      url: linkToCall,
    });

    return result;
  }
}
