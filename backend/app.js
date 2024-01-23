const exp = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const fetchRoutes = require('./routes/fetch');

dotenv.config();

const app = exp();

const port = process.env.PORT;

const corsOptions = {
    origin: [
		'http://www.planetshah.com',
		'https://www.planetshah.com',
		'http://planetshah.com',
		'https://planetshah.com',
		'http://127.0.0.1:5501',
		'http://localhost:5501'
	],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

fs.appendFileSync('log.txt', new Date().toString() + ': CORS set up.\n');

app.use(exp.urlencoded({extended: false}));
app.use('/fetch', fetchRoutes);

app.listen(port);

fs.appendFileSync('log.txt', new Date().toString() + ': app.js is running and listening on port ' + port + '\n');

console.log('Listening on port', port);

module.exports = app;

