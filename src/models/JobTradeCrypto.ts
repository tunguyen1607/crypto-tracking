import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let JobTradeCrypto = sequelize.define(
    'JobTradeCrypto',
    {
      // attributes
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jobId: {
        type: Sequelize.STRING,
      },
      botIds: {
        type: Sequelize.STRING,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  // await Crypto.sync({ force: false });
  return JobTradeCrypto;
};
