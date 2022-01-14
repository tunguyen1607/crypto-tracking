import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoMarketPairHistoricalTime = sequelize.define(
    'CryptoMarketPairHistoricalTime',
    {
      // attributes
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      marketPairId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      exchangeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      datetime: {
        type: Sequelize.DATE,
      },
      timestamp: {
        type: Sequelize.INTEGER,
      },
      baseAsset: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quoteAsset: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
      },
      timeOpen: {
        type: Sequelize.DATE,
      },
      priceOpen: {
        type: Sequelize.FLOAT,
      },
      timeClose: {
        type: Sequelize.DATE,
      },
      priceClose: {
        type: Sequelize.FLOAT,
      },
      priceHigh: {
        type: Sequelize.FLOAT,
      },
      priceLow: {
        type: Sequelize.FLOAT,
      },
      priceChange24h: {
        type: Sequelize.FLOAT,
      },
      pricePercent24h: {
        type: Sequelize.FLOAT,
      },
      baseVolume: {
        type: Sequelize.FLOAT,
      },
      quoteVolume: {
        type: Sequelize.FLOAT,
      },
      market: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.STRING,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  await CryptoMarketPairHistoricalTime.sync({ force: true });
  return CryptoMarketPairHistoricalTime;
};
