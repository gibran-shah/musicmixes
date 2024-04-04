let tracks = [];
let trackIndex = 0;
let howl;
let repeat = false;
let continuous = false;
let positionBarTimer;
let trackInfoTimer;
let trackInfoScrollTimer;
let currentTrackDuration = 0;
let paused = false;
let wasPlayingBeforeDrag = false;
let volume = 0;
let upperVolumeLimit;
let lowerVolumeLimit;

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
            setVolumeLimits();
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
    initializeTrackInfo();

    if (positionBarTimer) clearInterval(positionBarTimer);
    positionBarTimer = setInterval(() => updatePositionBar(), 1000);

    if (trackInfoTimer) clearTimeout(trackInfoTimer);
    if (trackInfoScrollTimer) clearInterval(trackInfoScrollTimer);
    trackInfoTimer = setTimeout(() => {
        trackInfoScrollTimer = setInterval(() => updateTrackInfo(), 50);
    }, 3000);

    if (howl) howl.unload();
    howl = new Howl({
        src: [`${frontend}/music/${mixNum}.${mixName}/${filename}`]
    });
    initializeVolume();

    howl.on('end', trackEnded);
    howl.on('play', () => { showCurrentTrackIcon(); togglePlayPause(); });
    howl.on('pause', () => { hideCurrentTrackIcon(); togglePlayPause(); });
    howl.on('load', () => currentTrackDuration = howl.duration());
    
    howl.play();
    paused = false;
}

function stopTrack() {
    if (howl) howl.stop();
    clearInterval(positionBarTimer);
    clearNowPlayingBar();
    hideCurrentTrackIcon();
    togglePlayPause();
    initializePositionBar();
}

function trackEnded() {
    clearInterval(positionBarTimer);
    clearNowPlayingBar();
    initializePositionBar();

    if (continuous) {
        if (trackIndex < tracks.length - 1)
            playNextTrack();
        else if (repeat) playFirstTrack();
        else {
            hideCurrentTrackIcon();
            togglePlayPause();
        }
    } else if (repeat) {
        playTrack();
    } else {
        hideCurrentTrackIcon();
        togglePlayPause();
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
    stopTrack();
}

function playPauseClicked() {
    if (howl) {
        if (howl.playing()) {
            howl.pause();
            paused = true;
        }
        else if (howl.seek() > 0) {
            howl.play();
            if (positionBarTimer) clearInterval(positionBarTimer);
            positionBarTimer = setInterval(() => updatePositionBar(), 1000);
            paused = false;
        }
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

function positionNobDragged(event) {
    if ((howl && howl.playing()) || paused) {
        wasPlayingBeforeDrag = wasPlayingBeforeDrag || howl.playing();
        howl.pause();
        paused = true;
        if (positionBarTimer) clearInterval(positionBarTimer);

        const positionBar = document.querySelector('.position-bar');
        const positionNob = document.querySelector('.position-nob');
        const completedBar = document.querySelector('.completed-bar');

        const rightLimit = positionBar.clientWidth - 8;

        let x = event.x - positionBar.offsetLeft;
        x = x < -3 ? -3 : x;
        x = x > rightLimit ? rightLimit : x;

        positionNob.style.left = x;
        completedBar.style.width = completedBar.style.left + x;
    }
}

function positionNobDragEnded(event) {
    positionNobDragged(event);

    const completedBar = document.querySelector('.completed-bar');
    const positionBar = document.querySelector('.position-bar');
    const percentComplete = completedBar.clientWidth / positionBar.clientWidth;
    howl.seek(percentComplete * currentTrackDuration);

    if (wasPlayingBeforeDrag) {
        wasPlayingBeforeDrag = false;
        howl.play();
        positionBarTimer = setInterval(() => updatePositionBar(), 1000);
        paused = false;
    }
}
 
// #endregion position bar

// #endregion controls

// #region track info

function initializeTrackInfo() {
    const track = tracks[trackIndex];
    const trackInfo = getTrackInfo(track);

    const trackInfoContainer = document.querySelector('.track-info-container');
    trackInfoContainer.style.left = 5;
    trackInfoContainer.innerHTML = `<span>${trackInfo}</span>`;

    const nowPlayingContainer = document.querySelector('.now-playing-container');
    const npcWidth = nowPlayingContainer.clientWidth;
    const ticWidth = trackInfoContainer.clientWidth;

    const trackInfoContainer2 = document.querySelector('.track-info-container-2');
    trackInfoContainer2.style.left = npcWidth > ticWidth ? (npcWidth + 100) : (ticWidth + 100);
    trackInfoContainer2.innerHTML = `<span>${trackInfo}</span>`;
}

function getTrackInfo(track) {
    return `${track.trackNum}. ${track.title} - ${track.artist}`;
}

function updateTrackInfo() {
    const trackInfoContainer = document.querySelector('.track-info-container');
    const left = parseInt(trackInfoContainer.style.left.replace('px', ''));
    trackInfoContainer.style.left = left - 1;

    const trackInfoContainer2 = document.querySelector('.track-info-container-2');
    const left2 = parseInt(trackInfoContainer2.style.left.replace('px', ''));
    trackInfoContainer2.style.left = left2 - 1;

    if (trackInfoContainer2.style.left === '5px') {
        initializeTrackInfo();
    }
}

function clearNowPlayingBar() {
    clearTimeout(trackInfoTimer);
    clearInterval(trackInfoScrollTimer);

    const trackInfoContainer = document.querySelector('.track-info-container');
    trackInfoContainer.innerHTML = '';

    const trackInfoContainer2 = document.querySelector('.track-info-container-2');
    trackInfoContainer2.innerHTML = '';
}

// #endregion track info

// #region volume
function setVolumeLimits() {
    const volumeLevelBar = document.querySelector('.volume-level-bar');
    upperVolumeLimit = volumeLevelBar.offsetTop;
    lowerVolumeLimit = volumeLevelBar.offsetTop + volumeLevelBar.clientHeight;
    volumeLevelBar.style.maxHeight = lowerVolumeLimit - upperVolumeLimit;
}

function initializeVolume() {
    const volumeLevelBar = document.querySelector('.volume-level-bar');
    const volumeLevel = document.querySelector('.volume-level');
    volume = volumeLevel.clientHeight / volumeLevelBar.clientHeight;

    if (howl) howl.volume(volume);
}

function volumeDrag(event) {
    const volumeLevelBar = document.querySelector('.volume-level-bar');
    const volumeLevel = document.querySelector('.volume-level');
    const volumeLevelNob = document.querySelector('.volume-level-nob');

    let y = event.y;
    y = y < upperVolumeLimit ? upperVolumeLimit : y;
    y = y > lowerVolumeLimit ? lowerVolumeLimit : y;

    volumeLevelNob.style.top = y - upperVolumeLimit - 3;
    const nobLowerLimit = lowerVolumeLimit - upperVolumeLimit - 8;
    const nobTop = parseInt(volumeLevelNob.style.top.replace('px', ''));
    volumeLevelNob.style.top =  nobTop > nobLowerLimit ? nobLowerLimit : nobTop;
 
    volumeLevel.style.height = lowerVolumeLimit - y;

    volume = volumeLevel.clientHeight / volumeLevelBar.clientHeight;
    if (howl) howl.volume(volume);
}

function volumeDragEnd(event) {
    volumeDrag(event);
}

// #endregion volume