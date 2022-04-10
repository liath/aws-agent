const browser = require('webextension-polyfill');

const keyupHandler = () => browser.storage.sync.set({
  accessKeyId: document.getElementById('keyid').value,
  secretAccessKey: document.getElementById('secret').value,
  sessionToken: document.getElementById('session_token').value,
});

document.addEventListener('DOMContentLoaded', async () => {
  const creds = await browser.storage.sync.get({
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
  });

  document.getElementById('keyid').value = creds.accessKeyId;
  document.getElementById('secret').value = creds.secretAccessKey;
  document.getElementById('session_token').value = creds.sessionToken;
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', keyupHandler);
    input.addEventListener('keyup', keyupHandler);
    input.addEventListener('paste', keyupHandler);
    input.addEventListener('pointerover', keyupHandler);
  });
});
