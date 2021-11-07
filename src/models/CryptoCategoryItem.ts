import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoCategoryItem = sequelize.define(
    'CryptoCategoryItem',
    {
      cryptoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sourceCryptoId: {
        type: Sequelize.STRING,
      },
      sourceCategoryId: {
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
  await CryptoCategoryItem.sync({ force: false });
  return CryptoCategoryItem;
};
