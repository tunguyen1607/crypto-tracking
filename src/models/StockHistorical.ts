import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let StockHistorical = sequelize.define(
    'StockHistorical',
    {
      // attributes
      stockId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      date: {
        type: Sequelize.STRING,
      },
      priceChange: {
        type: Sequelize.FLOAT,
      },
      priceAdjust: {
        type: Sequelize.FLOAT,
      },
      priceClose: {
        type: Sequelize.FLOAT,
      },
      priceOpening: {
        type: Sequelize.FLOAT,
      },
      ceiling: {
        type: Sequelize.FLOAT,
      },
      floor: {
        type: Sequelize.FLOAT,
      },
      percentChange: {
        type: Sequelize.FLOAT,
      },
      percentStatus: {
        type: Sequelize.STRING,
      },
      volumeMatched: {
        type: Sequelize.FLOAT,
      },
      transactionMatched: {
        type: Sequelize.FLOAT,
      },
      volumeOffer: {
        type: Sequelize.FLOAT,
      },
      transactionOffer: {
        type: Sequelize.FLOAT,
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
  await StockHistorical.sync({ force: false });
  return StockHistorical;
};
