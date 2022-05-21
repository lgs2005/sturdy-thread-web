import * as bcrypt from 'bcrypt'
import { Database } from "../database";
import { Err, Ok, Result } from "../result";
import { Route } from "../routes";
import Schemas from "../schemas";
import { randomUUID } from "crypto";

const PEPPER = 'Malagueta'

const enum LoginError {
    TakenUsername = 'taken_username',
    WrongUsername = 'wrong_username',
    WrongPassword = 'wrong_password',
}

// Doesnt extend base request, /login is skipped on the main hook
interface Query {
	username: string,
	password: string,
	register?: boolean
}

interface Response {
	userid: number,
	token: string,
}

export default {
	url: '/login',
	method: 'GET',

	query: {
		type: 'object',
		required: ['username', 'password'],
		properties: {
			username: { type: 'string', maxLenght: 50, minLenght: 1 },
			password: { type: 'string', maxLenght: 50, minLenght: 1 },
			register: { type: 'boolean' },
		}
	},

	response: Schemas.Result({
		type: 'object',
		required: ['userid', 'token'],
		properties: {
			userid: { type: 'number' },
			token: { type: 'string' },
		}
	}),

	handler: async (req: Query, db: Database) => {
		const fetchResult = await db.fetchUser(req.username);

		if (req.register) {
			if (fetchResult.ok) {
				return Err(LoginError.TakenUsername);
			}
	
			const token = randomUUID();
			const hash = await bcrypt.hash(req.password + PEPPER, 10);
			const user = await db.createUser(req.username, hash, token);

			await db.createCalendar('Meu Calendário', user.id, 'Este é o seu primeiro calendário.');
	
			return Ok({
				userid: user.id,
				token: token,
			});
		} else {
			if (!fetchResult.ok) {
				return Err(LoginError.WrongUsername);
			}
	
			const user = fetchResult.value;
			const authorized = await bcrypt.compare(req.password + PEPPER, user.hash);
	
			if (!authorized) {
				return Err(LoginError.WrongPassword);
			}
	
			user.token = randomUUID();
			await db.updateUser(user);
	
			return Ok({
				userid: user.id,
				token: user.token,
			});
		}
	},

} as Route<Query, Result<Response>>