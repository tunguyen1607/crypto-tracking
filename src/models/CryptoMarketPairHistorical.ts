import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoMarketPairHistorical = sequelize.define(
    'CryptoMarketPairHistorical',
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
      timestamp: {
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATE
      },
      baseAsset: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quoteAsset: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      priceChange: {
        type: Sequelize.STRING,
      },
      priceChangePercent: {
        type: Sequelize.STRING,
      },
      baseVolume: {
        type: Sequelize.STRING,
      },
      quoteVolume: {
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
      timeHigh: {
        type: Sequelize.DATE,
      },
      priceHigh: {
        type: Sequelize.STRING,
      },
      timeLow: {
        type: Sequelize.DATE,
      },
      priceLow: {
        type: Sequelize.STRING,
      },
      market: {
        type: Sequelize.STRING,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  await CryptoMarketPairHistorical.sync({ force: false });
  return CryptoMarketPairHistorical;
};
