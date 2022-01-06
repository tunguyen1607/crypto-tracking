import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoExchange = sequelize.define(
    'CryptoExchange',
    {
      // attributes
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      year_established: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      url: {
        type: Sequelize.STRING,
      },
      image: {
        type: Sequelize.STRING,
      },
      has_trading_incentive: {
        type: Sequelize.STRING,
      },
      description: {
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
  await CryptoExchange.sync({ force: false });
  return CryptoExchange;
};
