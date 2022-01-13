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
      exchangeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      exchangeName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      exchangeNotice: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      exchangeSlug: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      feeType: {
        type: Sequelize.STRING,
        allowNull: true,
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
      baseVolume: {
        type: Sequelize.FLOAT,
      },
      quoteVolume: {
        type: Sequelize.FLOAT,
      },
      usdVolume: {
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
      marketUrl: {
        type: Sequelize.STRING,
      },
      marketScore: {
        type: Sequelize.STRING,
      },
      marketReputation: {
        type: Sequelize.FLOAT,
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
