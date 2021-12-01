import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoMarket = sequelize.define(
    'CryptoMarket',
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
      config: {
        type: Sequelize.JSONB,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      market: {
        type: Sequelize.STRING,
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
  await CryptoMarket.sync({ force: false });
  return CryptoMarket;
};
