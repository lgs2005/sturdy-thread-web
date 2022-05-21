import { FastifyInstance } from "fastify";
import { Database } from "./database";
import { SchemaType } from "./schema_typing";

export interface Route<T, U> {
	url: string,
	method: 'GET' | 'POST' | 'DELETE',
	body?: SchemaType,
	query?: SchemaType,
	response?: SchemaType,
	handler: (req: T, db: Database) => U | Promise<U>,
}

export interface BaseRequest {
	userid: number,
	usertoken: string,
}

async function getRoutes() {
	return await Promise.all([
		import('./routes/login'),

		import('./routes/search_events'),
		import('./routes/publish_event'),
		import('./routes/delete_event'),

		import('./routes/search_calendars'),
		import('./routes/publish_calendar'),
		import('./routes/delete_calendar'),

		import('./routes/add_share'),
		import('./routes/revoke_share'),
		import('./routes/get_share'),
	]).then(list => list.map(module => module.default));
}

export async function connectRoutes(server: FastifyInstance) {
	const routes = await getRoutes();

	for (const route of routes.values()) {
		server.route({
			url: route.url,
			method: route.method,
			schema: {
				querystring: route.query,
				body: route.body,
				response: route.response && { 200: route.response },
			},
			handler: async (request, reply) => {
				const req: any = route.method == 'GET'
					? request.query
					: request.body;

				req.userid = (request as any).userid
				req.usertoken = (request as any).usertoken

				const result = await route.handler(req, await Database.connect());

				console.table(result);

				return result;
			}
		});
	}
}