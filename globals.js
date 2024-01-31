const hostname = window.location.hostname;
const frontend = (
  (hostname === '127.0.0.1' || hostname === 'localhost')
    ? 'http://localhost:5500'
    : 'http://planetshah/pwv'
);
const backend = (
  (hostname === '127.0.0.1' || hostname === 'localhost')
    ? 'http://localhost'
    : 'http://ec2-18-223-71-133.us-east-2.compute.amazonaws.com'
) + ':3000/';

function getUrlParam(param) {
  const href = window.location.href;
  const parts = href.split('?');
  const params = parts[1].split('&');
  for (let i = 0; i < params.length; i++) {
    const keyValue = params[i].split('=');
    if (keyValue[0] === param) return keyValue[1];
  }
}