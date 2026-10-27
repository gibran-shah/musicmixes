const hostname = window.location.hostname;
const frontend = (
  (hostname === '127.0.0.1' || hostname === 'localhost')
    ? `http://${hostname}:5501`
    : 'https://mixes.planetshah.com'
);

const backend = (
  (hostname === '127.0.0.1' || hostname === 'localhost')
    ? `http://${hostname}:3002`
    : 'https://mixes.planetshah.com'
) + '/';

function getUrlParam(param) {
  const href = window.location.href;
  const parts = href.split('?');
  const params = parts[1].split('&');
  for (let i = 0; i < params.length; i++) {
    const keyValue = params[i].split('=');
    if (keyValue[0] === param) return keyValue[1];
  }
}