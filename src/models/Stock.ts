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
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      epsLastYear: {
        type: Sequelize.INTEGER,
      },
      //EPS 4 quý gần nhất
      epsLast4Quarter: {
        type: Sequelize.STRING,
      },
      // vốn hóa
      capitalization: {
        type: Sequelize.INTEGER,
      },
      pe: {
        type: Sequelize.INTEGER,
      },
      price: {
        type: Sequelize.FLOAT,
      },
      priceRef: {
        type: Sequelize.FLOAT,
      },
      priceCeiling: {
        type: Sequelize.FLOAT,
      },
      priceFloor: {
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
      createdAt: {
        type: Sequelize.INTEGER,
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      updatedAt: {
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
