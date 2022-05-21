export class ConstrainedQuery {
	query: string
	constraints: string[] = []
	args: any[] = []

	constructor(query: string) {
		this.query = query
	}

	add(constraint: string, ...args: any[]) {
		this.constraints.push(constraint);
		this.args.push(...args);
	}

	filter(constraint: string, ...args: any[]) {
		if (args.indexOf(undefined) == -1) {
			this.add(constraint, ...args);
		}
	}

	filterAll(...filters: [string, ...any][]) {
		filters.forEach((filter) => this.filter(...filter));
	}

	resolve() {
		return this.query + " WHERE " + this.constraints.join(" AND ");
	}
}