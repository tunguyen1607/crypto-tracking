import Sequelize from 'sequelize';
export default async ({ sequelize }) => {
  // @ts-ignore
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
      logo: {
        type: Sequelize.TEXT,
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
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      urls: {
        type: Sequelize.JSONB,
      },
      socials: {
        type: Sequelize.JSONB,
      },
      platform: {
        type: Sequelize.JSONB,
      },
      tags: {
        type: Sequelize.JSONB,
      },
      category: {
        type: Sequelize.STRING,
      },
      price: {
        type: Sequelize.FLOAT,
      },
      volume: {
        type: Sequelize.FLOAT,
      },
      lastTimeUpdatePrice: {
        type: Sequelize.INTEGER,
      },
      jobId: {
        type: Sequelize.STRING,
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
      rank: {
        type: Sequelize.INTEGER,
      },
      marketCap: {
        //Market Cap = Current Price x Circulating Supply.
        type: Sequelize.STRING,
      },
      subreddit: {
        type: Sequelize.STRING,
      },
      isHidden: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      twitterUsername: {
        type: Sequelize.STRING,
      },
      notice: {
        //Market Cap = Current Price x Circulating Supply.
        type: Sequelize.TEXT,
      },
      startTimestampHistorical: {
        type: Sequelize.INTEGER,
      },
      lastTimestampHistorical: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      market: {
        type: Sequelize.STRING,
      },
      statusMarket: {
        type: Sequelize.STRING,
      },
      numberOfMarkets: {
        type: Sequelize.INTEGER,
      },
      numberOfExchanges: {
        type: Sequelize.INTEGER,
      },
    },
    {
      // options
      timestamps: true,
    },
  );
  // await Crypto.sync({ force: false });
  return Crypto;
};
