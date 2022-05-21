import { Calendar } from '../database'
import { BaseRequest, Route } from '../routes'

interface Req extends BaseRequest {
    id: number,
}

export default {
    method: 'DELETE',
    url: '/delete/calendars',

    body: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'number', minimum: 1}
        }
    },

    handler: async (req, db) => {
        const calendar = await db.filterCalendars({
            id: req.id
        });

        
        if (calendar[0] != undefined && calendar[0].owner == req.userid) {
            await db.deleteCalendar(req.id);
        }

        return null;
    }
} as Route<Req, null>