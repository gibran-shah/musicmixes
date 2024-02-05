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
        link.onclick = () => fetchMix(l[0], l[1]);
        link.innerHTML = l[1];
        foreGroundContainer.appendChild(link);
    });
}

function fetchMix(mixNum, mixName) {
    ajax(
        'fetch/mix',
        'GET',
        { mixNum, mixName },
        (response) => {
            localStorage.setItem(mixNum, response);
            localStorage.setItem('mix name', mixName);
            window.location.href = `${frontend}/mix.html?mix=${mixNum}`;
        },
        (error) => {
            console.log(error);
        }
    );
}

function loadMixPage() {
    const mixNum = getUrlParam('mix');
    if (mixNum) {
        const tracks = localStorage.getItem(mixNum);
        injectTracks(tracks);
    } else {
        console.log('missing mix param');
    }
}

function injectTracks(tracks) {
    if (!Array.isArray(tracks)) tracks = JSON.parse(tracks);
    const tracksContainer = document.querySelector('#tracks-container');

    tracks.forEach((t, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="javascript:playTrack(${i})">${i+1}. ${t.artist} - ${t.title}</a>`;
        tracksContainer.append(li);
    });
}

function playTrack(index) {
    const mixNum = getUrlParam('mix');
    const mixName = localStorage.getItem('mix name');
    const tracks = document.querySelectorAll('#tracks-container li a');
    const fileName = tracks[index].innerHTML;
    const audio = new Audio(`${frontend}/music/${mixNum}.${mixName}/${fileName}`);
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