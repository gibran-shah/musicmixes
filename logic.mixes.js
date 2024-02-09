let tracks = [];
let trackIndex = 0;

function loadMixListPage() {
    ajax(
        'fetch/mix-list',
        'GET',
        null,
        (response) => {
            const list = JSON.parse(response);
            const groomedList = list.map(item => item.split('.'))
                .sort((item1, item2) => {
                    const num1 = parseInt(item1[0], 10);
                    const num2 = parseInt(item2[0], 10);
                    return num1 > num2 ? 1 : -1;
                });
            injectMixList(groomedList);
        },
        (error) => {
            console.log(error);
        }
    );
}

function injectMixList(list) {
    const foreGroundContainer = document.querySelector('.foreground-container');
    list.forEach(l => {
        const link = document.createElement('a');
        link.setAttribute('href', 'javascript:void(0)');
        link.onclick = () => mixClicked(l[0]);
        link.innerHTML = l[1];
        foreGroundContainer.appendChild(link);
    });
}

function mixClicked(mixNum, mixName) {
    window.location.href = `${frontend}/mix.html?mix=${mixNum}`;
}

function loadMixPage() {
    const mixNum = getUrlParam('mix');
    if (mixNum) {
        fetchMix(mixNum);
    } else {
        console.log('missing mix param');
    }
}

function fetchMix(mixNum) {
    ajax(
        'fetch/mix',
        'GET',
        { mixNum },
        (response) => {
            tracks = JSON.parse(response);
            tracks = tracks.sort((t1, t2) => t1.trackNum > t2.trackNum ? 1 : -1);
            trackIndex = 0;
            injectTracks();
        },
        (error) => {
            console.log(error);
        }
    );
}

function injectTracks() {
    const tracksUL = document.querySelector('#tracks-container ul');

    tracks.forEach((t, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="javascript:playTrack(${i})">${i+1}. ${t.artist} - ${t.title}</a>`;
        tracksUL.append(li);
    });
}

function playTrack() {
    const track = tracks[trackIndex];
    const { mixNum, mixName, filename } = track;
    const audio = new Audio(`${frontend}/music/${mixNum}.${mixName}/${filename}`);
    audio.play();
}

function previousTrackClicked() {
    alert('previous track clicked');
}

function trackStartClicked() {
    alert('track start clicked');
}

function stopClicked() {
    alert('stop clicked');
}

function playPauseClicked() {
    alert('play pause clicked');
}

function nextTrackClicked() {
    alert('next track clicked');
}