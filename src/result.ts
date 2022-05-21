export type Ok<T> = { ok: true, value: T };
export type Err<E> = { ok: false, err: E};
export type Result<T, E = string> = Ok<T> | Err<E>;

export function Err<E>(error: E): Err<E> {
	return { ok: false, err: error };
}

export function Ok<T>(value: T): Ok<T> {
	return { ok: true, value: value };
}