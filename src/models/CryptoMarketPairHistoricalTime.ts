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
      exchangeName: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
  await CryptoMarketPairHistoricalTime.sync({ force: false });
  return CryptoMarketPairHistoricalTime;
};
