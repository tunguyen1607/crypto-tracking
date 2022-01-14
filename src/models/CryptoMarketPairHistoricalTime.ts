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
        type: Sequelize.STRING,
      },
      timeOpen: {
        type: Sequelize.DATE,
      },
      priceOpen: {
        type: Sequelize.STRING,
      },
      timeClose: {
        type: Sequelize.DATE,
      },
      priceClose: {
        type: Sequelize.STRING,
      },
      priceHigh: {
        type: Sequelize.STRING,
      },
      priceLow: {
        type: Sequelize.STRING,
      },
      priceChange24h: {
        type: Sequelize.STRING,
      },
      pricePercent24h: {
        type: Sequelize.STRING,
      },
      baseVolume: {
        type: Sequelize.STRING,
      },
      quoteVolume: {
        type: Sequelize.STRING,
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
  await CryptoMarketPairHistoricalTime.sync({ force: false });
  return CryptoMarketPairHistoricalTime;
};
