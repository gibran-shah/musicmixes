let tracks = [];
let trackIndex = 0;
let howl;
let repeat = false;
let continuous = false;
let positionBarTimer;
let positionDragOn = false;
let trackInfoTimer;
let trackInfoScrollTimer;
let trackTimeTimer;
let currentTrackDuration = 0;
let currentTrackTime = 0;
let paused = false;
let wasPlayingBeforeDrag = false;
let volume = 0;
let upperVolumeLimit;
let lowerVolumeLimit;
let muted = false;
let volumeDragOn = false;

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
    const foreGroundInnerContainer = document.querySelector('.foreground-inner-container');
    list.forEach((l, i) => {
        const link = document.createElement('a');
        link.setAttribute('href', 'javascript:void(0)');
        link.onclick = () => mixClicked(l[0]);
        link.innerHTML = l[1];
        foreGroundInnerContainer.appendChild(link);

        if (i < list.length - 1) {
            const divider = document.createElement('span');
            divider.innerHTML = '|';
            foreGroundInnerContainer.appendChild(divider);
        }
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
            setTitle();
            injectTracks();
            setVolumeLimits();
        },
        (error) => {
            console.log(error);
        }
    );
}

function setTitle() {
    // title on page
    const trackTitle = document.querySelector('.track-title');
    trackTitle.innerHTML = tracks[0].mixName;

    // title in browser tab header
    const title = document.querySelector('title');
    title.innerHTML = tracks[0].mixName;
}

function injectTracks() {
    const tracksUL = document.querySelector('#tracks-container ul');

    tracks.forEach((t, i) => {
        const li = document.createElement('li');
        li.id = `track${i}`;
        if (t.artist?.length && t.title?.length) {
            songName = `${t.artist} - ${t.title}`;
        } else {
            songName = t.filenameNoExtension;
        }
        li.innerHTML = `<a href="javascript:trackClicked(${i})">${i+1}. ${songName}</a>`;
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

    if (trackTimeTimer) clearInterval(trackTimeTimer);
    trackTimeTimer = setInterval(() => updateTrackTime(), 1000);

    if (howl) howl.unload();
    howl = new Howl({
        src: [`${frontend}/music/${mixNum}.${mixName}/${filename}`],
        autoplay: true,
        html5: true
    });

    initializeVolume();

    howl.on('end', trackEnded);
    howl.on('play', () => { showCurrentTrackIcon(); togglePlayPause(); });
    howl.on('pause', () => { hideCurrentTrackIcon(); togglePlayPause(); });
    howl.on('load', () => { currentTrackDuration = howl.duration(); initializeTrackTime(); });
    
    howl.play();
    paused = false;
}

function stopTrack() {
    if (howl) howl.stop();
    clearInterval(positionBarTimer);
    clearNowPlayingBar();
    clearTrackTime();
    hideCurrentTrackIcon();
    togglePlayPause();
    initializePositionBar();
}

function trackEnded() {
    clearInterval(positionBarTimer);
    clearNowPlayingBar();
    clearTrackTime();
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

function positionMouseDown(event) {
    positionDragOn = true;
}

function positionMouseUp(event) {
    positionNobDragEnded(event);
    positionDragOn = false;
}

function positionNobDragged(event) {
    if (positionDragOn && ((howl && howl.playing()) || paused)) {
        wasPlayingBeforeDrag = wasPlayingBeforeDrag || howl.playing();
        howl.pause();
        paused = true;
        if (positionBarTimer) clearInterval(positionBarTimer);

        const positionBar = document.querySelector('.position-bar');
        const positionNob = document.querySelector('.position-nob');
        const completedBar = document.querySelector('.completed-bar');

        const leftLimit = 0;
        const rightLimit = positionBar.clientWidth;

        let x = event.x - positionBar.offsetLeft;

        x = x < leftLimit ? leftLimit : x;
        x = x > rightLimit ? rightLimit : x;

       const halfNob = positionNob.clientWidth / 2;

        positionNob.style.left = Math.max(x - halfNob, 0);
        completedBar.style.width = x;
        positionNob.offsetLeft = Math.max(x - halfNob, 0);
        completedBar.clientWidth = x;
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
    let songName;
    if (track.artist?.length && track.title?.length) {
        songName = `${track.artist} - ${track.title}`;
    } else {
        songName = track.filenameNoExtension;
    }
    return `${track.trackNum}. ${songName}`;
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
    volume = calculateCurrentVolume();
    if (howl) howl.volume(volume);
}

function volumeMouseDown(event) {
    if (!muted) {
        volumeDragOn = true;
    }
}

function volumeMouseUp(event) {
    volumeDragEnd(event);
    volumeDragOn = false;
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

function volumeClicked() {
    toggleVolumeIcon();
    if (muted) {
        enableVolumeControl();
        muted = false;
        volume = calculateCurrentVolume();
    } else {
        disableVolumeControl();
        muted = true;
        volume = 0;
    }
    if (howl) howl.volume(volume);
}

function disableVolumeControl() {
    const volumeLevel = document.querySelector('.volume-level');
    const volumeLevelNob = document.querySelector('.volume-level-nob');

    volumeLevel.setAttribute('disabled', true);
    volumeLevelNob.setAttribute('disabled', true);
    volumeLevelNob.removeAttribute('ondrag');
    volumeLevelNob.removeAttribute('ondragend');
}

function enableVolumeControl() {
    const volumeLevel = document.querySelector('.volume-level');
    const volumeLevelNob = document.querySelector('.volume-level-nob');

    volumeLevel.removeAttribute('disabled');
    volumeLevelNob.removeAttribute('disabled');
    volumeLevelNob.setAttribute('ondrag', 'volumeDrag(event)');
    volumeLevelNob.setAttribute('ondragend', 'volumeDragEnd(event)');
}

function toggleVolumeIcon() {
    const volumeIcon = document.querySelector('.volume-button i');
    volumeIcon.classList.remove(muted ? 'fa-volume-xmark' : 'fa-volume-high');
    volumeIcon.classList.add(muted ? 'fa-volume-high' : 'fa-volume-xmark');
}

function calculateCurrentVolume() {
    const volumeLevel = document.querySelector('.volume-level');
    const volumeLevelBar = document.querySelector('.volume-level-bar');

    return volumeLevel.clientHeight / volumeLevelBar.clientHeight;
}

// #endregion volume

// #region track time

function initializeTrackTime() {
    const totalTimeSpan = document.querySelector('.total-time');
    const timeRemainingSpan = document.querySelector('.time-remaining');

    if (!currentTrackDuration && howl) currentTrackDuration = howl.duration();

    totalTimeSpan.innerHTML = convertTo_mmss(currentTrackDuration);
    timeRemainingSpan.innerHTML = '0:00';
}

function convertTo_mmss(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);

    return `${hours > 0 ? hours+':' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function updateTrackTime() {
    const timeRemainingSpan = document.querySelector('.time-remaining');
    const currentTime = howl.seek();
    timeRemainingSpan.innerHTML = convertTo_mmss(currentTime);
}

function clearTrackTime() {
    const timeRemainingSpan = document.querySelector('.time-remaining');
    const totalTimeSpan = document.querySelector('.total-time');
    timeRemainingSpan.innerHTML = '';
    totalTimeSpan.innerHTML = '';
    if (trackTimeTimer) clearInterval(trackTimeTimer);
}

// #endregion track time

// #region back button

function backButtonClicked() {
    document.removeEventListener('mousemove', mouseMoveListener);
    document.removeEventListener('mouseup', mouseUpListener);
    window.location.href = 'index.html';
}

// #endregion back button

// #region global event listeners
function mouseMoveListener(event) {
    if (volumeDragOn) {
        volumeDrag(event);
    }
    if (positionDragOn) {
        positionNobDragged(event);
    }
}

document.addEventListener('mousemove', mouseMoveListener);

function mouseUpListener(event) {
    if (volumeDragOn) {
        volumeMouseUp(event);
    }
    if (positionDragOn) {
        positionMouseUp(event);
    } 
}

document.addEventListener('mouseup', mouseUpListener);

// #endregion global event listeners