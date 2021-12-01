import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let Crypto = sequelize.define(
    'Crypto',
    {
      // attributes
      symbols: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jobId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userId: {
        type: Sequelize.STRING,
      },
      state: {
        type: Sequelize.STRING, //prepare | starting | running | stop | error | expired
      },
      status: {
        type: Sequelize.INTEGER, //1:active | 0:inactive
      }
    },
    {
      // options
      timestamps: true,
    },
  );
  // await Crypto.sync({ force: false });
  return Crypto;
};
