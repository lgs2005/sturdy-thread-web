import { SchemaType } from "./schema_typing"

export default {
    Result: (schema: SchemaType = { type: 'null' }) => {
        return {
            type: 'object',
            required: ['ok'],
            properties: {
                ok: { type: 'boolean' },
                err: { type: 'string' },
                value: schema,
            }
        }
    },

    Array: (schema: SchemaType) => {
        return {
            type: 'array',
            items: schema,
        }
    }
}