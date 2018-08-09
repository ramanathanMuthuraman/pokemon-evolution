const pushNotificationPublicKey = 'BK5BKWWQG8T69lE8GsEbmQV8nrSNDetBz0U2QAUIVAWUGO7luWHcCMDWcETWxAlcjDRwPHaKOA8xdor8XEgcpBE';
let swReg;

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function initialisePushNotification(swRegistration) {
  swReg = swRegistration;
  swRegistration.pushManager.getSubscription().then(subscription => {
    console.log('Your subscription ', subscription);
    localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    if (subscription === null) {
      console.log('user not subscribed');
    } else {
      console.log('user subscribed');
    }
  });
}

document.querySelector('#copyKey').addEventListener('click', function () {
  const copyText = document.getElementById('subscription-content');
  copyText.select();
  document.execCommand("copy");
  const tooltip = document.querySelector('.tooltiptext');
  tooltip.innerHTML = "Copied: " + copyText.value;
});

document.querySelector('#copyKey').addEventListener('mouseout', function () {
  const tooltip = document.querySelector('.tooltiptext');
  tooltip.innerHTML = "Copy to clipboard";
});


document.querySelector('#bell').addEventListener('click', function () {
  const element = document.querySelector('#bell');
  const isSubscribed = element.classList.contains('subscription-active');
  if(!isSubscribed) {
    swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(pushNotificationPublicKey)
    }).then(function (subscription) {
      console.log('subscription is ', subscription);
      const subscriptionItem = JSON.stringify(subscription);
      localStorage.setItem('pushSubscription', subscriptionItem);
      document.querySelector('#subscription-content').value = subscriptionItem;
      document.querySelector('.tooltip-container').classList.toggle('hidden');
      element.classList.add('subscription-active');
    }, function (err) {
      console.log('some error in subscription', err);
    });
  } else {
    document.querySelector('.tooltip-container').classList.toggle('hidden');
    console.log('subscribed already');
  }
});