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
  await CryptoMarketPairHistorical.sync({ force: false });
  return CryptoMarketPairHistorical;
};