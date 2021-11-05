import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoHistorical = sequelize.define(
    'CryptoHistorical',
    {
      cryptoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sourceId: {
        type: Sequelize.STRING,
      },
      date: {
        type: Sequelize.DATE,
      },
      timestamp: {
        type: Sequelize.INTEGER,
      },
      timeOpen: {
        type: Sequelize.DATE,
      },
      priceOpen: {
        type: Sequelize.FLOAT,
      },
      timeHigh: {
        type: Sequelize.DATE,
      },
      priceHigh: {
        type: Sequelize.FLOAT,
      },
      timeLow: {
        type: Sequelize.DATE,
      },
      priceLow: {
        type: Sequelize.FLOAT,
      },
      timeClose: {
        type: Sequelize.DATE,
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
        type: Sequelize.DATE,
      },
      // eslint-disable-next-line @typescript-eslint/camelcase
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  await CryptoHistorical.sync({ force: false });
  return CryptoHistorical;
};
