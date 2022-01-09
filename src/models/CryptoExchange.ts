import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoExchange = sequelize.define(
    'CryptoExchange',
    {
      // attributes
      sourceId: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      type: {
        type: Sequelize.STRING,
      },
      tags: {
        type: Sequelize.JSONB,
      },
      fiats: {
        type: Sequelize.JSONB,
      },
      dateLaunched: {
        type: Sequelize.DATE,
      },
      notice: {
        type: Sequelize.TEXT,
      },
      countries: {
        type: Sequelize.JSONB,
      },
      is_active: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.STRING,
      },
      urls: {
        type: Sequelize.JSONB,
      },
      has_trading_incentive: {
        type: Sequelize.STRING,
      },
      is_redistributable: {
        type: Sequelize.STRING,
      },
      maker_fee: {
        type: Sequelize.FLOAT,
      },
      taker_fee: {
        type: Sequelize.FLOAT,
      },
      is_hidden: {
        type: Sequelize.INTEGER,
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
