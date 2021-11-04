import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoHistorical = sequelize.define(
    'CryptoHistorical',
    {
      cryptoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      date: {
        type: Sequelize.STRING,
      },
      timestamp: {
        type: Sequelize.DATE,
      },
      priceOpen: {
        type: Sequelize.FLOAT,
      },
      priceHigh: {
        type: Sequelize.FLOAT,
      },
      priceLow: {
        type: Sequelize.FLOAT,
      },
      priceClose: {
        type: Sequelize.FLOAT,
      },
      volume: {
        type: Sequelize.FLOAT,
      },
      marketCap: {
        //Market Cap = Current Price x Circulating Supply.
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
  await CryptoHistorical.sync({ force: false });
  return CryptoHistorical;
};
