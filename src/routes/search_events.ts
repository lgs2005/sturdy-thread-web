import Schemas from '../schemas'
import { BaseRequest, Route } from "../routes";
import { CalendarEvent } from '../database'

interface Req extends BaseRequest {
	id?: number,
	calendar?: number,
	namelike?: string,
	before?: number,
	after?: number,
}

export default ({
	url: '/search/events',
	method: 'GET',

	query: {
		type: 'object',
		properties: {
			id: { type: 'number' },
			calendar: { type: 'number' },
			namelike: { type: 'string' },
			before: { type: 'number' },
			after: { type: 'number' },
		}
	},

	response: Schemas.Array({
		type: 'object',
		properties: {
			id: { type: 'number' },
			title: { type: 'string' },
			timestamp: { type: 'number', minimum: 0 },
			description: { type: 'string' },
			calendar: { type: 'number', minimum: 1},
		}
	}),

	handler: (req: Req, db) => {
		return db.filterEvents({
			id: req.id,
			calendar: req.calendar,
			after: req.after,
			before: req.before,
			namelike: req.namelike,
			visibleto: req.userid,
		});
	}

}) as Route<Req, CalendarEvent[]>