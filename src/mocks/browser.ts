import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { socketHandlers } from './realtime'

export const worker = setupWorker(...handlers, ...socketHandlers)