import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config(); // Carga tu .env local

export default new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'], 
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});