
import dotenv from 'dotenv';
dotenv.config();

let mysqlDbPort: number | undefined;

if(
  process.env.MYSQL_DB_PORT !== undefined
  && process.env.MYSQL_DB_PORT.length > 0
  && !isNaN(+process.env.MYSQL_DB_PORT)
) {
  mysqlDbPort = +process.env.MYSQL_DB_PORT;
}

const config = {
  MYSQL_DB_HOST: process.env.MYSQL_DB_HOST ?? '',
  MYSQL_DB_PORT: mysqlDbPort,
  MYSQL_DB_USER: process.env.MYSQL_DB_USER ?? '',
  MYSQL_DB_PASSSWORD: process.env.MYSQL_DB_PASSSWORD ?? '',
};

export {
  config,
};
