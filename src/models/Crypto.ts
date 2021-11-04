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
      image: {
        type: Sequelize.STRING,
      },
      dateAdded: {
        type: Sequelize.DATE,
      },
      lastUpdated: {
        type: Sequelize.DATE,
      },
      sourceId: {
        type: Sequelize.STRING,
      },
      source: {
        type: Sequelize.STRING,
      },
      slug: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      platform: {
        type: Sequelize.JSONB,
      },
      tags: {
        type: Sequelize.JSONB,
      },
      categoryId: {
        type: Sequelize.INTEGER,
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
      volumeChange24h: {
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
      fullyDilutedMarketCap: {
        type: Sequelize.FLOAT,
      },
      maxSupply: {
        type: Sequelize.FLOAT,
      },
      totalSupply: {
        type: Sequelize.FLOAT,
      },
      cmcRank: {
        type: Sequelize.INTEGER,
      },
      marketCap: {
        //Market Cap = Current Price x Circulating Supply.
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.INTEGER,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  await Crypto.sync({ force: true });
  return Crypto;
};
