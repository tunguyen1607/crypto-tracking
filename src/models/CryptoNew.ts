import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let CryptoNew = sequelize.define(
    'CryptoNew',
    {
      cryptoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cryptoSourceId: {
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING(355),
        allowNull: false,
      },
      subtitle: {
        type: Sequelize.TEXT,
      },
      content: {
        type: Sequelize.TEXT,
      },
      cover: {
        type: Sequelize.STRING,
      },
      maxChar: {
        type: Sequelize.INTEGER,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      language: {
        type: Sequelize.STRING,
      },
      assets: {
        type: Sequelize.JSONB,
      },
      sourceName: {
        type: Sequelize.STRING,
      },
      sourceUrl: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.STRING,
      },
      visibility: {
        type: Sequelize.BOOLEAN,
      },
      status: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
      releasedAt: {
        type: Sequelize.DATE,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  await CryptoNew.sync({ force: false });
  return CryptoNew;
};
