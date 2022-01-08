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
      price: {
        type: Sequelize.FLOAT,
      },
      priceChange: {
        type: Sequelize.FLOAT,
      },
      priceChangePercent: {
        type: Sequelize.FLOAT,
      },
      volume: {
        type: Sequelize.FLOAT,
      },
      quoteVolume: {
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
      timeHigh: {
        type: Sequelize.DATE,
      },
      priceHigh: {
        type: Sequelize.FLOAT,
      },
      timeLow: {
        type: Sequelize.DATE,
      },
      priceLow: {
        type: Sequelize.FLOAT,
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
  await CryptoMarketPairHistorical.sync({ force: true });
  return CryptoMarketPairHistorical;
};
