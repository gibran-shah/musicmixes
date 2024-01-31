function startApp() {
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
            window.location.href = `mix.html?mix=${mixNum}`;
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

    tracks.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = t;
        tracksContainer.append(li);
    });
}

startApp();