import serverless from 'serverless-http'
import { app } from './app.js'

export const handler = serverless(app, {
  provider: 'aws',
  request(request, event, context) {
    request.awsEvent = event
    request.awsContext = context
  },
})
