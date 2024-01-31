const exp = require('express');
const fs = require('fs');

const router = exp.Router();

router.get('/mix-list', (req, res, next) => {
    let directoryList = fs.readdirSync('../music');
    res.send(JSON.stringify(directoryList));
});

router.get('/mix', (req, res, next) => {
    const { mixNum, mixName } = req.query;
    let tracks = fs.readdirSync(`../music/${mixNum}.${mixName}`);
    res.send(tracks);
});

module.exports = router;