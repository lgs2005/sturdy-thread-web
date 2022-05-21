import { User } from "../database";
import { Ok } from "../result";
import { BaseRequest, Route } from "../routes";
import Schemas from "../schemas";

interface Req extends BaseRequest {
    calendar: number,
}

export default {
    url: '/share/get',
    method: 'GET',

	query: {
		type: 'object',
		required: ['calendar'],
        properties: {
			calendar: { type: 'integer', minimum: 1 },
        }
	},

	response: Schemas.Array({
		type: 'string',
	}),

    handler: async (req: Req, db) => {
        const calendar = await db.filterCalendars({
			id: req.calendar,
			visibleto: req.userid,
		});

        if (calendar[0] != undefined) {
			const shares = await db.filterShares({
				calendar: req.calendar,
			});

			const users = await Promise.all(
				shares.map((share) => db.fetchUser(share.user))
			);

			return users
				.filter((result) => result.ok)
				.map((result) => (result as Ok<User>).value.name);
        } else {
			return [];
		}
    },
	
} as Route<Req, string[]>