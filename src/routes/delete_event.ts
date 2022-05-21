import { Calendar } from '../database'
import { BaseRequest, Route } from '../routes'

interface Req extends BaseRequest {
    id: number,
}

export default {
    method: 'DELETE',
    url: '/delete/events',

    body: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'number', minimum: 1}
        }
    },

    handler: async (req, db) => {
        const calendar = await db.filterEvents({
            id: req.id,
            visibleto: req.userid,
        });

        if (calendar[0] != undefined) {
            await db.deleteEvent(req.id);
        }

        return null;
    }
} as Route<Req, null>