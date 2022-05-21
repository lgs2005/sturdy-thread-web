export type SchemaType = SchemaValue | SchemaObject | SchemaArray | SchemaString | SchemaNumber
export type SchemaPrimitive = 'boolean' | 'null'

interface SchemaValue {
    type: SchemaPrimitive | SchemaPrimitive[]
}

interface SchemaObject {
    type: 'object',
    required?: string[],
    properties: {
        [k: string]: SchemaType,
    },
}

interface SchemaArray {
    type: 'array',
    items: SchemaType,
}

interface SchemaString {
    type: 'string',
    maxLenght?: number,
    minLenght?: number,
}

interface SchemaNumber {
    type: 'number' | 'integer',
    minimum?: number,
}