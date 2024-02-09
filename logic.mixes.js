let tracks = [];
let trackIndex = 0;
let howl;

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
        li.id = `track${i}`;
        li.innerHTML = `<a href="javascript:trackClicked(${i})">${i+1}. ${t.artist} - ${t.title}</a>`;
        tracksUL.append(li);
    });
}

function trackClicked(index) {
    trackIndex = index;
    playTrack();
}

function playTrack() {
    const track = tracks[trackIndex];
    const { mixNum, mixName, filename } = track;

    highlightCurrentTrack();

    if (howl) howl.unload();
    howl = new Howl({
        src: [`${frontend}/music/${mixNum}.${mixName}/${filename}`]
    });
    howl.on('end', trackEnded);
    howl.on('play', () => { showCurrentTrackIcon(); togglePlayPause(); });
    howl.on('pause', () => { hideCurrentTrackIcon(); togglePlayPause(); });
    howl.on('stop', () => { hideCurrentTrackIcon(); togglePlayPause() });
    howl.play();
}

function highlightCurrentTrack() {
    const tracks = document.querySelectorAll('#tracks-container li');
    tracks.forEach(t => {
        if (t.id === `track${trackIndex}`) {
            t.classList.add('current-track');
            const currentTrackIcon = document.createElement('i');
            currentTrackIcon.classList.add('fa-solid', 'fa-volume-high', 'current-track-icon');
            t.append(currentTrackIcon);
        } else {
            t.classList.remove('current-track');
        }
    });
}

function showCurrentTrackIcon() {
    hideCurrentTrackIcon();

    const tracks = document.querySelectorAll('#tracks-container li');
    const currentTrack = tracks[trackIndex];
    const currentTrackIcon = document.createElement('i');
    currentTrackIcon.classList.add('fa-solid', 'fa-volume-high', 'current-track-icon');
    currentTrack.append(currentTrackIcon);
}

function hideCurrentTrackIcon() {
    const previousTrackIcon = document.querySelector('.current-track-icon');
    if (previousTrackIcon) previousTrackIcon.remove();
}

function trackEnded() {
    hideCurrentTrackIcon();
}

function previousTrackClicked() {
    alert('previous track clicked');
}

function trackStartClicked() {
    alert('track start clicked');
}

function stopClicked() {
    if (howl) howl.stop();
}

function playPauseClicked() {
    if (howl) {
        if (howl.playing()) howl.pause();
        else if (howl.seek() > 0) howl.play();
        else playTrack();
    } else playTrack();
}

function nextTrackClicked() {
    alert('next track clicked');
}

function togglePlayPause() {
    const playPauseButton = document.querySelector('#play-pause-button');

    if (howl) {
        if (howl.playing()) {
            playPauseButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            playPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>'
        }
    } else {
        playPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>'
    }
}