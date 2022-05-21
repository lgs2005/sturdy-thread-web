import { Err, Ok, Result } from "../result";
import { BaseRequest, Route } from "../routes";
import schemas from "../schemas";

interface Body extends BaseRequest {
    calendar: number,
    user: number,
}

export default {
    url: '/share/add',
    method: 'POST',

	body: {
		type: 'object',
		required: ['calendar', 'user'],
        properties: {
			calendar: { type: 'integer', minimum: 1 },
			user: { type: 'string', minLenght: 1, maxLenght: 50 },
        }
	},

    response: { type: 'string' },

    handler: async (req: Body, db) => {
        const user = await db.fetchUser(req.user);
        const calendars = await db.filterCalendars({id: req.calendar});

        if (!user.ok) return 'user_doesnt_exist';
        if (user.value.id == req.userid) return 'already_shared';
        if (calendars.length == 0) return 'calendar_doesnt_exist';
        if (calendars[0].owner != req.userid) return 'unauthorized';


        const shares = await db.filterShares({
            user: user.value.id,
            calendar: calendars[0].id,
        });

        if (shares.length == 0) {
            await db.createShare(user.value.id, calendars[0].id);
            return 'ok';
        } else {
            return 'already_shared';
        }
    }
	
} as Route<Body, string>