import { pool } from './db';
import { 
  users, columns, experiences, tags, experienceTags 
} from '../shared/schema';

// This script creates all tables in the database
async function main() {
  console.log('Creating database tables...');

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log('Users table created');

    // Create columns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS columns (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        dropdown_options TEXT[] NULL,
        allow_multiple BOOLEAN DEFAULT FALSE,
        is_visible BOOLEAN DEFAULT TRUE,
        "order" INTEGER NOT NULL
      );
    `);
    console.log('Columns table created');

    // Create experiences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS experiences (
        id SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        custom_fields JSONB NOT NULL
      );
    `);
    console.log('Experiences table created');

    // Create tags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `);
    console.log('Tags table created');

    // Create experience_tags table with foreign keys
    await pool.query(`
      CREATE TABLE IF NOT EXISTS experience_tags (
        id SERIAL PRIMARY KEY,
        experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(experience_id, tag_id)
      );
    `);
    console.log('ExperienceTags table created');

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

main()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });