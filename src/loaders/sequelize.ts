import Sequelize from 'sequelize';
import configuration from '../config';

const createConnection = config => {
  return new Promise(function(resolve, reject) {
    // @ts-ignore
    const connection = new Sequelize(config.database, config.user, config.password, {
      host: config.host,
      dialect: 'mysql' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
    connection
      .authenticate()
      .then(() => {
        console.log('Connection has been established successfully.');
        resolve(connection);
      })
      .catch(err => {
        console.error('Unable to connect to the database:', err);
        reject(err);
      });
  });
}

export default async () => {
  return new Promise(function() {
    let connection = {};
    if (configuration.sequelize instanceof Array) {
      configuration.sequelize.forEach(async function(config) {
        connection[config.database] = await createConnection(config);
      });
    }
  });
};
