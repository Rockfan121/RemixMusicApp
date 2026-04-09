export const timeout200 = (r: (value: unknown) => void): NodeJS.Timeout =>
	setTimeout(r, 200);
export const timeout300 = (r: (value: unknown) => void): NodeJS.Timeout =>
	setTimeout(r, 300);
export const timeout500 = (r: (value: unknown) => void): NodeJS.Timeout =>
	setTimeout(r, 500);
export const timeout1000 = (r: (value: unknown) => void): NodeJS.Timeout =>
	setTimeout(r, 1000);
export const timeout1500 = (r: (value: unknown) => void): NodeJS.Timeout =>
	setTimeout(r, 1500);
