document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    accessKeyId: '',
    secretAccessKey: '',
  }, creds => {
    document.getElementById('keyid').value = creds.accessKeyId;
    document.getElementById('secret').value = creds.secretAccessKey;
  });
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keyup', () => chrome.storage.sync.set({
      accessKeyId: document.getElementById('keyid').value,
      secretAccessKey: document.getElementById('secret').value,
    }));
  });
});
