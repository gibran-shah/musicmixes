let tracks = [];
let trackIndex = 0;
let howl;
let repeat = false;
let continuous = false;
let positionBarTimer;
let currentTrackDuration = 0;

// #region loading

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
        initializePositionBar();
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

function initializePositionBar() {
    const completedBar = document.querySelector('.completed-bar');
    const positionNob = document.querySelector('.position-nob');

    completedBar.style.width = 0;
    positionNob.style.left = '-3px';
}

// #endregion loading

// #region playing

function trackClicked(index) {
    trackIndex = index;
    playTrack();
}

function playTrack() {
    const track = tracks[trackIndex];
    const { mixNum, mixName, filename } = track;

    highlightCurrentTrack();
    initializePositionBar();

    if (positionBarTimer) clearInterval(positionBarTimer);
    positionBarTimer = setInterval(() => updatePositionBar(), 1000);

    if (howl) howl.unload();
    howl = new Howl({
        src: [`${frontend}/music/${mixNum}.${mixName}/${filename}`]
    });
    howl.on('end', trackEnded);
    howl.on('play', () => { showCurrentTrackIcon(); togglePlayPause(); });
    howl.on('pause', () => { hideCurrentTrackIcon(); togglePlayPause(); });
    howl.on('stop', () => trackStopped());
    howl.on('load', () => currentTrackDuration = howl.duration());
    howl.play();
}

function trackStopped() {
    clearInterval(positionBarTimer);
    hideCurrentTrackIcon();
    togglePlayPause();
    initializePositionBar();
}

function trackEnded() {
    clearInterval(positionBarTimer);
    initializePositionBar();

    if (continuous) {
        if (trackIndex < tracks.length - 1)
            playNextTrack();
        else if (repeat) playFirstTrack();
        else hideCurrentTrackIcon();
    } else if (repeat) {
        playTrack();
    } else {
        hideCurrentTrackIcon();
    }
}

function playNextTrack() {
    if (trackIndex < tracks.length - 1) trackIndex++;
    else return;

    hideCurrentTrackIcon();
    highlightCurrentTrack();
    if (howl) {
        const wasPlaying = howl.playing();
        wasPlaying && howl.stop();
        playTrack();
    }
}

function playFirstTrack() {
    trackIndex = 0;

    hideCurrentTrackIcon();
    highlightCurrentTrack();
    if (howl) {
        const wasPlaying = howl.playing();
        wasPlaying && howl.stop();
        playTrack();
    }
}

function highlightCurrentTrack() {
    const tracks = document.querySelectorAll('#tracks-container li');
    tracks.forEach(t => {
        if (t.id === `track${trackIndex}`) {
            t.classList.add('current-track');
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

// #endregion playing

// #region controls

function previousTrackClicked() {
    if (trackIndex > 0) trackIndex--;
    hideCurrentTrackIcon();
    highlightCurrentTrack();
    if (howl) {
        const wasPlaying = howl.playing();
        wasPlaying && howl.stop();
        playTrack();
    }
}

function trackStartClicked() {
    if (howl) {
        if (howl.playing()) playTrack();
        else if (howl.seek() > 0) howl.seek(0);
    }
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
    playNextTrack();
}

function togglePlayPause() {
    const playPauseButton = document.querySelector('#play-pause-button');

    if (howl) {
        if (howl.playing()) {
            playPauseButton.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            playPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    } else {
        playPauseButton.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

function repeatCheckboxClicked() {
    const repeatCheckbox = document.querySelector('#repeat-checkbox');
    repeat = repeatCheckbox.checked;
}

function continuousCheckboxClicked() {
    const continuousCheckbox = document.querySelector('#continuous-checkbox');
    continuous = continuousCheckbox.checked;
}

// #region position bar

function updatePositionBar() {
    const position = howl.seek();
    const percentDone = (position / currentTrackDuration) * 100;

    const completedBar = document.querySelector('.completed-bar');
    const positionNob = document.querySelector('.position-nob');

    const percentString = `${percentDone}%`;
    completedBar.style.width = percentString;
    positionNob.style.left = percentString;
}

// #endregion position bar

// #endregion controls