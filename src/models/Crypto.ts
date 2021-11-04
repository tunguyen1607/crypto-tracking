import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  let Crypto = sequelize.define(
    'Crypto',
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
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
      },
      priceChange24h: {
        type: Sequelize.FLOAT,
      },
      priceChangePercent24h: {
        type: Sequelize.FLOAT,
      },
      priceHighest24h: {
        type: Sequelize.FLOAT,
      },
      priceLowest24h: {
        type: Sequelize.FLOAT,
      },
      percentStatus: {
        type: Sequelize.STRING,
      },
      volume24h: {
        type: Sequelize.FLOAT,
      },
      volume: {
        type: Sequelize.FLOAT,
      },
      marketDominance: {
        type: Sequelize.STRING,
      },
      circulatingSupply: {
        type: Sequelize.FLOAT,
      },
      maxSupply: {
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
  await Crypto.sync({ force: false });
  return Crypto;
};
