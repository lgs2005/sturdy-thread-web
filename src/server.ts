import Fastify from "fastify";
import { Database } from "./database";
import { connectRoutes } from "./routes";
import { runSetup } from "./setup_db";

async function start() {
	await runSetup(await Database.connect());

	const server = Fastify({ logger: true });

	server.addHook('onError', (request, reply, error) => console.error(error));

	server.register(require('fastify-cors'), {
		origins: false,
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type', 'x-auth-id', 'x-auth-token'],
	});

	server.addHook('onRequest', async (request, reply) => {
		if (!request.routerPath?.endsWith('/login')) {
			const idstr = request.headers['x-auth-id'];
			const token = request.headers['x-auth-token'];

			if (typeof (idstr) == 'string' && typeof (token) == 'string') {
				const id = parseInt(idstr);
				const db = await Database.connect();
				const userResult = await db.fetchUser(id);

				if (userResult.ok && userResult.value.token == token) {
					(request as any).userid = id;
					(request as any).usertoken = token;
					return;
				}
			}

			reply.code(401);
			reply.send('Unathorized.');
		}
	});

	await connectRoutes(server);
	return await server.listen(3000);
}

start()
	.then(port => console.log(`Server listening on port ${port}.`))
	.catch(err => console.error(`Failed to start server: ${err}.`));