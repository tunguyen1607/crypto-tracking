import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoHistorical = sequelize.define(
    'CryptoHistoricalTime',
    {
      cryptoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      symbol: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sourceId: {
        type: Sequelize.STRING,
      },
      datetime: {
        type: Sequelize.DATE,
      },
      timestamp: {
        type: Sequelize.INTEGER,
      },
      price: {
        type: Sequelize.INTEGER,
      },
      volume: {
        type: Sequelize.FLOAT,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.STRING,
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
