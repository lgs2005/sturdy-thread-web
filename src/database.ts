import * as sqlite from 'sqlite';
import { Database as SQLite3Driver } from 'sqlite3';
import { Ok, Err } from './result';
import { ConstrainedQuery } from './constrained_query';

const DEFAULT_SETTINGS: sqlite.ISqlite.Config = {
	driver: SQLite3Driver,
	filename: './.data/dev.db',
}

function propertyValidator<T>(propertyList: (keyof T)[]) {
	return (object: any): object is T => {
		for (const property in propertyList.values()) {
			if (object[property] === undefined) {
				return false
			}
		}
		return true
	}
}

export interface User {
	id: number,
	name: string,
	hash: string,
	token: string,
}

export interface CalendarEvent {
	id: number,
	title: string,
	timestamp: number,
	calendar: number,
	description: string,
}

export interface Calendar {
	id: number,
	title: string,
	owner: number,
	description: string,
}

export interface Share {
	user: number,
	calendar: number,
}

const validateUser = propertyValidator<User>(['id', 'hash', 'name', 'token'])
const calendarValidator = propertyValidator<Calendar>(['id', 'title', 'owner', 'description']);
const eventValidator = propertyValidator<CalendarEvent>(['id', 'title', 'timestamp', 'calendar', 'description']);
const shareValidator = propertyValidator<Share>(['calendar', 'user']);

function wrapNamePattern(name?: string) {
	if (name != undefined) {
		return '%' + name + '%';
	}
}

export class Database {
	db: sqlite.Database;
	constructor(db: sqlite.Database) { this.db = db }

	static async connect(settings: sqlite.ISqlite.Config = DEFAULT_SETTINGS) {
		const db = await sqlite.open(settings);
		db.exec('PRAGMA foreign_keys = ON');
		return new Database(db);
	}
	
    async get<T>(
		query: string,
		params: any[],
		validate: (data: unknown) => data is T
	) {
		const data = await this.db.get<unknown>(query, params);

		if (data == undefined) {
			return Err('empty' as const);
		} else if (!validate(data)) {
			return Err('invalid' as const);
		} else {
			return Ok(data);
		}
	}

	async all<T>(
		query: string,
		params: any[],
		validate: (data: unknown) => data is T
	) {
		const data = await this.db.all<unknown[]>(query, params);
		return data.filter(validate);
	}

	exec(query: string) {
		return this.db.exec(query);
	}

	run(query: string, args: any[]) {
		return this.db.run(query, args);
	}

	async insertAndReturnId(query: string, args: any[]) {
		const result = await this.db.run(query, args);
		
		if (result.lastID == undefined) {
			throw 'Not a insert statement.'
		} else {
			return result.lastID;
		}
	}
	
	fetchUser(idOrName: string | number) {
		return this.get(
			'SELECT id, name, hash, token FROM User WHERE ' + 
				(typeof(idOrName) == 'string' ? 'name=?' : 'id=?'),
			[idOrName], validateUser, 
		);
	}

	async createUser(name: string, hash: string, token: string): Promise<User> {
		const id = await this.insertAndReturnId(
			'INSERT INTO User (name, hash, token) VALUES (?, ?, ?)',
			[name, hash, token],
		);

		return {
			id: id,
			name: name,
			hash: hash,
			token: token,
		};
	}

	updateUser(user: User) {
		return this.run(
			'UPDATE User SET token=? WHERE id=?',
			[user.token, user.id]
		)
	}

	filterEvents(
		filter: {
			id?: number,
			calendar?: number,
			namelike?: string,
			before?: number,
			after?: number,
			visibleto?: number,
			limit?: number,
		}
	) {
		const query = new ConstrainedQuery(
			"SELECT ev.id, ev.title, ev.timestamp, ev.calendar, ev.description FROM Event ev"
		);

		if (filter.visibleto != undefined) {
			query.query += ' INNER JOIN Calendar cal ON cal.id = ev.calendar';
			query.filter(
				'(? = cal.owner OR cal.id IN (SELECT sh.calendar FROM Share sh WHERE sh.user = ?))',
				filter.visibleto,
				filter.visibleto,
			);
		}

		query.filterAll(
			['ev.id = ?', filter.id],
			['ev.calendar = ?', filter.calendar],
			['ev.title LIKE ?', wrapNamePattern(filter.namelike)],
			['ev.timestamp <= ?', filter.before],
			['ev.timestamp >= ?', filter.after],
		);

		return this.all<CalendarEvent>(
			query.resolve() + ` LIMIT ${filter.limit?.toString() ?? '100'}`,
			query.args, eventValidator,
		);
	}

	async createEvent(title: string, timestamp: number, description: string, calendar: number): Promise<CalendarEvent> {
		const id = await this.insertAndReturnId(
			'INSERT INTO Event (title, timestamp, description, calendar) VALUES (?, ?, ?, ?)',
			[title, timestamp, description, calendar]
		);

		return {
			id: id,
			title: title,
			timestamp: timestamp,
			description: description,
			calendar: calendar,
		};
	}

	updateEvent(event: CalendarEvent) {
		return this.run(
			'UPDATE Event SET title = ?, timestamp = ?, description = ?, calendar = ? WHERE id = ?',
			[event.title, event.timestamp, event.description, event.calendar, event.id]
		);
	}

	deleteEvent(event: number) {
		return this.run(
			'DELETE FROM Event WHERE id = ?',
			[event]
		);
	}

	filterCalendars(
		filter: {
			id?: number,
			owner?: number,
			namelike?: string,
			visibleto?: number,
			limit?: number,
		}
	) {
		const query = new ConstrainedQuery('SELECT cal.id, cal.title, cal.owner, cal.description FROM Calendar cal');

		query.filterAll(
			[
				'(? = cal.owner OR cal.id IN (SELECT sh.calendar FROM Share sh WHERE sh.user = ?))',
				filter.visibleto,
				filter.visibleto,
			],
			['cal.id = ?', filter.id],
			['cal.title LIKE ?', wrapNamePattern(filter.namelike)],
			['cal.owner = ?', filter.owner],
		);

		return this.all<Calendar>(
			query.resolve() + ` LIMIT ${filter.limit?.toString() ?? '100'}`,
			query.args, calendarValidator,
		);
	}

	async createCalendar(title: string, owner: number, description: string): Promise<Calendar> {
		const id = await this.insertAndReturnId(
			'INSERT INTO Calendar (title, owner, description) VALUES (?, ?, ?)',
			[title, owner, description]
		);

		return {
			id: id,
			title: title,
			owner: owner,
			description: description,
		};
	}

	updateCalendar(calendar: Calendar) {
		return this.run(
			'UPDATE Calendar SET title = ?, description = ? WHERE id = ?',
			[calendar.title, calendar.description, calendar.id]
		);
	}


	deleteCalendar(calendar: number) {
		return this.run(
			'DELETE FROM Calendar WHERE id = ?',
			[calendar]
		);
	}

	filterShares(
		filter: {
			user?: number,
			calendar?: number,
			limit?: number,
		}
	) {
		const query = new ConstrainedQuery('SELECT * FROM Share sh');

		query.filterAll(
			['sh.user = ?', filter.user],
			['sh.calendar = ?', filter.calendar],
		);

		return this.all<Share>(
			query.resolve() + ` LIMIT ${filter.limit?.toString() ?? '100'}`,
			query.args, shareValidator,
		);
	}

	async createShare(user: number, calendar: number): Promise<Share> {
		await this.run(
			'INSERT INTO Share (user, calendar) VALUES (?, ?)',
			[user, calendar]
		)

		return {
			user: user,
			calendar: calendar,
		};
	}

	deleteShare(user: number, calendar: number) {
		return this.run(
			'DELETE FROM Share WHERE user = ? AND calendar = ?',
			[user, calendar]
		);
	}
}