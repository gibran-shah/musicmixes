const exp = require('express');
const fs = require('fs');

const router = exp.Router();

router.get('/', (req, res, next) => {
    let directoryList = fs.readdirSync('../music');
    res.send(JSON.stringify(directoryList));
});

module.exports = router;