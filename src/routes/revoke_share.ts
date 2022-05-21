import { BaseRequest, Route } from "../routes";

interface Body extends BaseRequest {
    calendar: number,
    user: number,
}

export default {
    url: '/share/revoke',
    method: 'DELETE',

	body: {
		type: 'object',
		required: ['calendar', 'user'],
        properties: {
			calendar: { type: 'integer', minimum: 1 },
			user: { type: 'string', minLenght: 1, maxLenght: 50 },
        }
	},

    handler: async (req: Body, db) => {
        const user = await db.fetchUser(req.user);
        const calendars = await db.filterCalendars({
            id: req.calendar
        });

        if (user.ok && calendars.length > 0 && calendars[0].owner == req.userid) {
            await db.deleteShare(user.value.id, calendars[0].id);
        }

        return null;
    }
	
} as Route<Body, null>