const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'})

const doc = {
  info: {
    title: 'IP address app API',
    description: 'IP address reservation application API',
  },
  host: 'localhost:3001',
  schemes: ['http'],
  consumes: [],  // by default: ['application/json']
  produces: [],  // by default: ['application/json']
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        in: 'header',
        name: 'Authorization',
        description: 'Bearer Token',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    }
  },
  definitions: {},          // by default: empty object (Swagger 2.0)
}

const outputFile = './docs/swagger-output.json'
const endpointsFiles = ['./app.js']

/* NOTE: if you use the express Router, you must pass in the
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc)