# node-url-shortener
A URL shortener service using Express and Node.js

For any long url, the service can generate a shortened url and handle a redirect to the original url.

Node Version: 18.20.0
Steps to Run the Project:
1. Git clone the repository
2. Create a mongodb connection, a database and a collection.
3. Create a .env file and populate the env variables as mentioned in the .env.sample
4. npm install the dependencies
5. Run server.js file to start the server
6. Use the POST API call with body as { "originalUrl": "<a long url to be shortened"> } to generate a short url.
7. Make a GET API call to the response(shortened url) recieved from the above POST API call to redirect to the original url.
   
