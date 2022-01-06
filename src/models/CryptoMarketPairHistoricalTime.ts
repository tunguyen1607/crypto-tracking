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
      exchangeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
      volume: {
        type: Sequelize.FLOAT,
      },
      quoteVolume: {
        type: Sequelize.FLOAT,
      },
      config: {
        type: Sequelize.JSONB,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      market: {
        type: Sequelize.STRING,
      },
      lastUpdate: {
        type: Sequelize.INTEGER,
      },
      statusMarket: {
        type: Sequelize.STRING,
      }
    },
    {
      // options
      timestamps: true,
    },
  );
  await CryptoMarketPairHistoricalTime.sync({ force: false });
  return CryptoMarketPairHistoricalTime;
};
