import { Calendar, CalendarEvent } from "../database";
import { BaseRequest, Route } from "../routes";

interface Body extends BaseRequest {
	id: number,
	title: string,
	description: string,
}

export default {
    url: '/publish/calendars',
    method: 'POST',

	body: {
		type: 'object',
		required: ['id', 'title', 'description'],
        properties: {
			id: { type: 'integer', minimum: 0},
			title: { type: 'string', minLenght: 1, maxLenght: 50 },
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
			owner: { type: 'number' },
			description: { type: 'string' },
		}
    },

    handler: async (req: Body, db) => {
		if (req.id != 0) {
			const result = await db.filterCalendars({
				id: req.id,
				visibleto: req.userid,
			});

			if (result[0] != undefined) {
				const calendar: Calendar = {
					id: req.id,
					title: req.title,
					description: req.description,
					owner: req.userid,
				};

				await db.updateCalendar(calendar);
				return calendar;
			} else {
				throw 'Invalid ID';
			}
		} else {
            return await db.createCalendar(req.title, req.userid, req.description);
		}
    }
	
} as Route<Body, Calendar>