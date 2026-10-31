export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, id] as const,
}