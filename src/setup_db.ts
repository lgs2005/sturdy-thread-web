import { Database } from './database';

export async function runSetup(db: Database) {
    await db.exec(`        
        CREATE TABLE IF NOT EXISTS User(
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            hash TEXT NOT NULL,
            token TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS Calendar(
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            owner INTEGER NOT NULL,
            description TEXT NOT NULL,
        
            CONSTRAINT fk_owner
                FOREIGN KEY (owner)
                REFERENCES User (id)
                ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS Event(
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            calendar INTEGER NOT NULL,
            description TEXT NOT NULL,
        
            CONSTRAINT fk_calendar
                FOREIGN KEY (calendar)
                REFERENCES Calendar (id)
                ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS Share (
            calendar INTEGER NOT NULL,
            user INTEGER NOT NULL,
        
            CONSTRAINT fk_calendar
                FOREIGN KEY (calendar)
                REFERENCES Calendar (id)
                ON DELETE CASCADE,
        
            CONSTRAINT fk_user
                FOREIGN KEY (user)
                REFERENCES User (id)
                ON DELETE CASCADE
        );
    `);
}