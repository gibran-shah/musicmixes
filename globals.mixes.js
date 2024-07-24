const hostname = window.location.hostname;
const frontend = (
  (hostname === '127.0.0.1' || hostname === 'localhost')
    ? `http://${hostname}:5501`
    : 'http://mixes.planetshah.com'
);
const backend = (
  (hostname === '127.0.0.1' || hostname === 'localhost')
    ? `http://${hostname}`
    : 'http://ec2-18-223-71-133.us-east-2.compute.amazonaws.com'
) + ':3002/';

function getUrlParam(param) {
  const href = window.location.href;
  const parts = href.split('?');
  const params = parts[1].split('&');
  for (let i = 0; i < params.length; i++) {
    const keyValue = params[i].split('=');
    if (keyValue[0] === param) return keyValue[1];
  }
}