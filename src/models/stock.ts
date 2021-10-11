import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let Stock = sequelize.define(
    'Stock',
    {
      // attributes
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      company: {
        type: Sequelize.STRING,
      },
      companyDescription: {
        type: Sequelize.STRING,
      },
      price: {
        type: Sequelize.FLOAT,
      },
      priceRef: {
        type: Sequelize.FLOAT,
      },
      ceiling: {
        type: Sequelize.FLOAT,
      },
      floor: {
        type: Sequelize.FLOAT,
      },
      percentChange: {
        type: Sequelize.STRING,
      },
      percentStatus: {
        type: Sequelize.STRING,
      },
      volume: {
        type: Sequelize.STRING,
      },
      volumeBuy: {
        type: Sequelize.STRING,
      },
      volumeSell: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      created_at: {
        type: Sequelize.INTEGER,
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      updated_at: {
        type: Sequelize.INTEGER,
      },
    },
    {
      // options
      timestamps: false,
    },
  );
  await Stock.sync({ force: false });
  return Stock;
};
