const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'})

const doc = {
  info: {
    title: 'IP address app API',
    description: 'IP address reservation application API',
  },
  host: 'localhost:3001',
  schemes: ['http'],
  consumes: ['application/json'],  // by default: ['application/json']
  produces: ['application/json'],  // by default: ['application/json']
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
    },
    schemas: {
      User: {
        name: {
          type: 'string',
          example: 'John Doe'
        },
        email: {
          type: 'string',
          example: 'john.doe@mail.com'
        },
        password: {
          type: 'string',
          example: '12345678'
        },
        group: {
          type: 'string',
          example: 'SomeGroup'
        }
      },
      IP: {
        ip: {
          type: 'string',
          example: '192.168.0.1'
        },
        desc: {
          type: 'string',
          example: 'Some description'
        },
        TTL: {
          type: 'number',
          example: '1'
        },
      },
      Network: {
        networkName: {
          type: 'string',
          example: 'SomeNetwork'
        },
        hostMin: {
          type: 'string',
          example: '192.168.0.100'
        },
        hostMax: {
          type: 'string',
          example: '192.168.0.200'
        },
        hostNetwork: {
          type: 'string',
          example: '24'
        },
        networkActive: {
          type: 'boolean',
          example: 'true'
        }
      }
    },
    definitions: {
      role: {
        '@enum': [
          'admin',
          'user',
          'null'
        ]
      }
    },
  }
}

const outputFile = './docs/swagger-output.json'
const endpointsFiles = ['./app.js']

/* NOTE: if you use the express Router, you must pass in the
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc)