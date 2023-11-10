
import mysql2 from 'mysql2/promise';

type MysqlDbOpts = {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

type QueryGenericType = mysql2.OkPacket | mysql2.RowDataPacket[] | mysql2.ResultSetHeader[] | mysql2.RowDataPacket[][] | mysql2.OkPacket[] | mysql2.ProcedureCallPacket;

export class MysqlDb {
  private constructor(
    public conn: mysql2.Connection,
    private pool: mysql2.Pool,
  ) {}

  execute<T extends QueryGenericType>(sql: string, values?: any) {
    // return this.pool.execute<T>(sql, values);
    return this.conn.execute<T>(sql, values);
  }

  async $destroy() {
    await this.conn.end();
    await this.pool.end();
  }

  static async init(opts: MysqlDbOpts) {
    let connOpts: mysql2.ConnectionOptions;
    let conn: mysql2.Connection;
    let pool: mysql2.Pool;
    connOpts = {
      host: opts.host,
      port: opts.port,
      user: opts.user,
      password: opts.password,
      database: opts.database,
    };

    conn = await mysql2.createConnection(connOpts);
    pool = await mysql2.createPool({
      ...connOpts,
      connectionLimit: 100
    });

    return new MysqlDb(conn, pool);
  }
}
