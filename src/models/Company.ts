import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let Company = sequelize.define(
    'Company',
    {
      // attributes
      name: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      country: {
        type: Sequelize.STRING,
      },
      revenueCurrent: {
        type: Sequelize.STRING,
      },
      profitBefTax: {
        type: Sequelize.STRING,
      },
      profitAftTax: {
        type: Sequelize.STRING,
      },
      dividendCash: {
        //co tuc bang tien
        type: Sequelize.STRING,
      },
      dividendStock: {
        //co tuc bang co phieu
        type: Sequelize.STRING,
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
  await Company.sync({ force: false });
  return Company;
};
