import Sequelize from 'sequelize';
import configuration from '../config';

const createConnection = config => {
  console.log(config);
  return new Promise(function(resolve, reject) {
    // @ts-ignore
    const connection = new Sequelize(config.database, config.user, config.password, {
      host: config.host,
      dialect: config.dialect /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      logging: false,
    });
    connection
      .authenticate()
      .then(async () => {
        console.log('Connection ' + config.database + ' has been established successfully.');
        resolve(connection);
      })
      .catch(err => {
        console.error('Unable to connect to the database ' + config.database, err);
        reject(err);
      });
  });
}

export default async () => {
  return new Promise(async function(resolve, reject) {
    let connection = {};
    try {
      if (configuration.sequelize instanceof Array) {
        console.log('list database found')
        connection = await createConnection(configuration.sequelize[0]);
        connection[configuration.sequelize[0].database] = connection;
        for (let index = 0; index < configuration.sequelize.length; index++) {
          if (index > 0) {
            let config = configuration.sequelize[index];
            connection[config.database] = await createConnection(config);
          }
        }
      } else {
        connection = await createConnection(configuration.sequelize);
      }
      resolve(connection);
    } catch (e) {
      reject(e);
    }
  });
};
