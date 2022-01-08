import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoMarketPair = sequelize.define(
    'CryptoMarketPair',
    {
      // attributes
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      baseAsset: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jobId: {
        type: Sequelize.FLOAT,
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
  await CryptoMarketPair.sync({ force: false });
  return CryptoMarketPair;
};
