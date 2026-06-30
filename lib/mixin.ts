// We need a type which we'll use to extend other classes from.
// The main responsibility is to declare that the type being passed in is a class.
export type Constructor<T = {}> = abstract new (...args: any[]) => T;
