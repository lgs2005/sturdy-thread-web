import { CalendarEvent } from "../database";
import { BaseRequest, Route } from "../routes";

interface Body extends BaseRequest {
	id: number,
	title: string,
	timestamp: number,
	description: string,
	calendar: number,
}

export default {
    url: '/publish/events',
    method: 'POST',

	body: {
		type: 'object',
		required: ['id', 'title', 'timestamp', 'calendar', 'description'],
        properties: {
			id: { type: 'integer', minimum: 0},
			title: { type: 'string', minLenght: 1 },
			timestamp: { type: 'integer', minimum: 0 },
			calendar: { type: 'integer', minimum: 1},
			description: {
				type: 'string',
				maxLenght: 500,
			},
        }
	},

    response: {
        type: 'object',
		properties: {
			id: { type: 'number' },
			title: { type: 'string' },
			timestamp: { type: 'number' },
			description: { type: 'string' },
			calendar: { type: 'number' }
		}
    },

    handler: async (req: Body, db) => {
		if (req.id != 0) {
			const result = await db.filterEvents({
				id: req.id,
				visibleto: req.userid,
			});

			if (result[0] != undefined) {
				const event: CalendarEvent = {
					id: req.id,
					title: req.title,
					description: req.description,
					timestamp: req.timestamp,
					calendar: result[0].calendar,
				}

				await db.updateEvent(event);
				return event;
			} else {
				throw 'Invalid ID';
			}
		} else {
            return await db.createEvent(req.title, req.timestamp, req.description, req.calendar);
		}
    }
	
} as Route<Body, CalendarEvent>