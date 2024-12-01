// Storing our template and initial data locally.
// These will be set the first time the widget is installed.
// See renderEmptyWidget.
let template = null;
let templateActions = [];
let initialData = null;
let installButton = document.querySelector('#install-button')

async function sendClientMessage(data) {
  const allClients = await clients.matchAll({
    includeUncontrolled: true,
    type: 'all'
  });
  allClients.forEach(client => {
    client.postMessage(data);
  });
}

// Make sure to update the widget to its initial state  when
// the service worker is activated.
// Widgets may be installed before a SW is activated, and if we
// don't update it now, it will be empty.
self.addEventListener('activate', (event) => {
  event.waitUntil(renderEmptyWidget());
});

// Listen to the widgetinstall event in order to update the widget
// when it gets installed the first time.
self.addEventListener('widgetinstall', (event) => {
  event.waitUntil(renderEmptyWidget(event));
  installButton.style.display = 'none';
});

// Listen to the widgetclick event to react to user actions in the widget.
self.addEventListener('widgetclick', (event) => {
  switch (event.action) {
    case 'next':
      event.waitUntil(sendClientMessage({ action: 'next' }));
      break;
    case 'previous':
      event.waitUntil(sendClientMessage({ action: 'previous' }));
      break;
  }
});