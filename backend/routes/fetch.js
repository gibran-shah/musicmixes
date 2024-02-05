const exp = require('express');
const fs = require('fs');
const mm = require('music-metadata');

const router = exp.Router();

router.get('/mix-list', (req, res, next) => {
    let directoryList = fs.readdirSync('../music');
    res.send(JSON.stringify(directoryList));
});

router.get('/mix', async (req, res, next) => {
    const { mixNum, mixName } = req.query;
    const tracks = fs.readdirSync(`../music/${mixNum}.${mixName}`);
    const trackMetadata = [];
    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const metadata = await mm.parseFile(`../music/${mixNum}.${mixName}/${track}`);
        trackMetadata.push({
            filename: track,
            title: metadata.common.title,
            artist: metadata.common.artist
        });
    }
    res.send(trackMetadata);
});

module.exports = router;