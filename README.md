# ipbackend1
<h2>ipbackend for project</h2>

The front end of this project is located in this repository: https://github.com/joonas-ris/ip_varaus

In the backend said front end is stored in the build folder.

This project handles an IP reservation system and in basic terms allows a user reserve and ip for their project use from the employers network.
At the moment the project is a database that allows users and is controlled by an admin. Admins must also enable new users so they are able to use the site.
A user will then request a number of IP addresses that have a set time limit to how long they will last. They can then extend the time said adress is online.
When said address expires it is deleted from the database.

Admins are able to set what IP addresses are allowed to be used and what are not.

To start the system requires a valid database to be used and has been built with MONGODB in mind and may require code changes for other databases.
The .env_template file has an example of what needs to be filled in a .env file to connect to the database.

To initialize the network and admin user the file createdefaultuser.js must be called, preferrably on a terminal, with the command `node ./controllers/createdefaultuser.js`, which is the default path. The file path is dependant on where the file is.
Calling said file will prompt the user to answer questions that then create the user. Note that the email given does not need to be valid as the system does not send emails at the moment.
Any created users must then be validated by an admin to allow regular functionality for users.

Users are allowed to change their own password, request IPs, extend the TTL of IPs and regular login/ logout functions. Admins can change another users password at will, allow and revoke usability from users, add ips, remove ips, remove users and promote users to admins.

The code has 3 schemas for users, ips and networks and API endpoints are documented via SWAGGER. The SWAGGER documentation can be accessed via (yourLocalhostAddress)/api-docs/. To run swagger auto-gen run the command `npm run swagger-autogen`

The project also has an eslintrc configuration file and multiple .REST request files.

<h2> Quick step by step start up of project </h2>

- Git clone the repository.
- run `npm install` for required packages.
- use either `npm run dev` or `npm start` in your preferred terminal that is opened to the projects root.
- navigate to http://localhost:3001/ on your preferred browser.
