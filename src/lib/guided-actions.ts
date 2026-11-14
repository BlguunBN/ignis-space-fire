export function takeNextAction<T>(actions: T[]): { next: T | undefined; remaining: T[] } {
  const [next, ...remaining] = actions;
  return { next, remaining };
}
