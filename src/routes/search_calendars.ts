import { Calendar } from "../database";
import { BaseRequest, Route } from "../routes";
import Schemas from "../schemas";

interface Query extends BaseRequest {
	id?: number,
	owner?: number,
	namelike?: string,
}

export default {
	url: '/search/calendars',
	method: 'GET',

	query: {
		type: 'object',
		properties: {
			id: { type: 'number' },
			owner: { type: 'number' },
			query: { type: 'string' },
		}
	},

	response: Schemas.Array({
        type: 'object',
        properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            owner: { type: 'number' },
            description: { type: 'string' },
        }
    }),

	handler: (req: Query, db) => {
		return db.filterCalendars({
			id: req.id,
			owner: req.owner,
			namelike: req.namelike,
			visibleto: req.userid,
		});
	}

} as Route<Query, Calendar[]>