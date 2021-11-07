import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoCategory = sequelize.define(
    'CryptoCategory',
    {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
      },
      slug: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      numTokens: {
        type: Sequelize.INTEGER,
      },
      avgPriceChange: {
        type: Sequelize.FLOAT,
      },
      marketCap: {
        type: Sequelize.FLOAT,
      },
      marketCapChange: {
        type: Sequelize.FLOAT,
      },
      volume: {
        type: Sequelize.FLOAT,
      },
      volumeChange: {
        type: Sequelize.FLOAT,
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
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  await CryptoCategory.sync({ force: true });
  return CryptoCategory;
};
