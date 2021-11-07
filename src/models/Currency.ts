import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let Currency = sequelize.define(
    'Currency',
    {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sign: {
        type: Sequelize.STRING,
      },
      symbol: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      sourceId: {
        type: Sequelize.STRING,
      },
      source: {
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
  await Currency.sync({ force: false });
  return Currency;
};
