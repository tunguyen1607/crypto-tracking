import Sequelize from 'sequelize';

export default async () => {
  return new Promise(function (resolve, reject) {
    // @ts-ignore
    const connection = new Sequelize('notification_base', 'root', 'tuantu123', {
      host: 'localhost',
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
};
