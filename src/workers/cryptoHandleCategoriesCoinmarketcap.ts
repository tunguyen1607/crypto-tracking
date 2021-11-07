import { Container } from 'typedi';
import PublishService from '../services/publish';
import { urlSlug } from '../helpers/crawler';
import axios from 'axios';

export default {
  queueName: 'crypto_handle_categories_coinmarketcap',
  status: true,
  run: async function(message, cb) {
    let object = JSON.parse(message.content.toString());
    console.log('receive message ', JSON.stringify(object));
    const cryptoCategoryModel = Container.get('cryptoCategoryModel');
    const cryptoCategoryItemModel = Container.get('cryptoCategoryItemModel');
    const cryptoModel = Container.get('cryptoModel');
    try {
      const result = await axios({
        method: 'GET',
        url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/categories?limit=500`,
        headers: {
          'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
        },
      });
      let list: any = result.data['data'];
      for (let i = 0; i < list.length; i++) {
        let categoryDetail: any = list[i];
        let body = {
          name: categoryDetail.name,
          title: categoryDetail.title,
          description: categoryDetail.description,
          numTokens: categoryDetail.num_tokens,
          slug: urlSlug(categoryDetail.name.toLowerCase()),
          avgPriceChange: categoryDetail.avg_price_change,
          marketCap: categoryDetail.market_cap,
          marketCapChange: categoryDetail.market_cap_change,
          volume: categoryDetail.volume,
          volumeChange: categoryDetail.volumeChange,
          lastUpdated: categoryDetail.last_updated,
          sourceId: categoryDetail.id,
          source: 'coinmarketcap',
          status: 1,
        };
        // @ts-ignore
        let cateDetail = await cryptoCategoryModel.findOne({
          where: {
            sourceId: categoryDetail.id + '',
            slug: urlSlug(categoryDetail.name.toLowerCase()),
          },
        });
        if (cateDetail) {
          // @ts-ignore
          await cryptoCategoryModel.update(body, {
            where: {
              sourceId: categoryDetail.id + '',
              symbol: categoryDetail.symbol,
              slug: urlSlug(categoryDetail.name.toLowerCase()),
            },
          });
          body['id'] = cateDetail.id;
          cateDetail = body;
        } else {
          // @ts-ignore
          cateDetail = await cryptoCategoryModel.create(body);
        }
        let categoryDetailRs = await axios({
          method: 'GET',
          url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/category?id=${categoryDetail.id}`,
          headers: {
            'X-CMC_PRO_API_KEY': `5c400230-4a9c-424a-9953-1b65624bbd7a`,
          },
        });
        let detailCategory = categoryDetailRs.data['data'];
        for (let j = 0; j < detailCategory.coins.length; j++) {
          let cryptoItem: any = detailCategory.coins[j];
          let bodyCrypto = {
            name: cryptoItem.name,
            symbol: cryptoItem.symbol,
            slug: cryptoItem.slug,
            dateAdded: cryptoItem.date_added,
            lastUpdated: cryptoItem.last_updated,
            maxSupply: cryptoItem.max_supply,
            circulatingSupply: cryptoItem.circulating_supply,
            totalSupply: cryptoItem.total_supply,
            cmcRank: cryptoItem.cmc_rank,
            tags: cryptoItem.tags,
            platform: cryptoItem.platform,
            price: cryptoItem.quote.USD.price,
            volume24h: cryptoItem.quote.USD.volume_24h,
            volumeChange24h: cryptoItem.quote.USD.volume_change_24h,
            marketCap: cryptoItem.quote.USD.market_cap,
            marketDominance: cryptoItem.quote.USD.market_cap_dominance,
            sourceId: cryptoItem.id,
            source: 'coinmarketcap',
            status: 1,
            fullyDilutedMarketCap: cryptoItem.quote.USD.fully_diluted_market_cap,
          };
          console.log(bodyCrypto);
          // @ts-ignore
          let cryptoDetail = await cryptoModel.findOne({
            where: { sourceId: cryptoItem.id + '', symbol: cryptoItem.symbol, slug: cryptoItem.slug },
          });
          if (cryptoDetail) {
            // @ts-ignore
            await cryptoModel.update(bodyCrypto, {
              where: { sourceId: cryptoItem.id + '', symbol: cryptoItem.symbol, slug: cryptoItem.slug },
            });
            bodyCrypto['id'] = cryptoDetail.id;
            cryptoDetail = bodyCrypto;
          } else {
            console.log({ sourceId: cryptoItem.id + '', symbol: cryptoItem.symbol, slug: cryptoItem.slug });
            // @ts-ignore
            cryptoDetail = await cryptoModel.create(bodyCrypto);
          }
          // @ts-ignore
          let cateItemDetail = await cryptoCategoryItemModel.findOne({
            where: {
              cryptoId: cryptoDetail.id,
              categoryId: cateDetail.id,
            },
          });
          if (cateItemDetail) {
            // @ts-ignore
            await cryptoCategoryItemModel.update(
              {
                cryptoId: cryptoDetail.id,
                categoryId: cateDetail.id,
                sourceCryptoId: cryptoDetail.sourceId,
                source: 'coinmarketcap',
                sourceCategoryId: cateDetail.sourceId,
              },
              {
                where: {
                  cryptoId: cryptoDetail.id,
                  categoryId: cateDetail.id,
                },
              },
            );
          } else {
            // @ts-ignore
            await cryptoCategoryItemModel.create({
              cryptoId: cryptoDetail.id,
              categoryId: cateDetail.id,
              sourceCryptoId: cryptoDetail.sourceId,
              source: 'coinmarketcap',
              sourceCategoryId: cateDetail.sourceId,
            });
          }
        }
      }
      // @ts-ignore
    } catch (e) {
      console.error(e);
    } finally {
      cb(true);
    }
  },
};
