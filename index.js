const app = require('express')();
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({'message': 'Server is running'});
}).listen(PORT, () => console.log(`Listening on ${ PORT }`));