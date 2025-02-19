const path = require('path');
const { isMainProcess } = require('./processUtils.cjs');

function showThreatNotification(fileName, isQuarantined) {
  const NOTIFICATION_TITLE = '⚠️ Malware Detected';
  const NOTIFICATION_BODY = `Malicious file detected: ${fileName}\n${isQuarantined ? '✅ File has been quarantined' : '❌ Quarantine failed'}`;

  try {
    if (isMainProcess()) {
      // Main process notification
      const { Notification } = require('electron');
      new Notification({
        title: NOTIFICATION_TITLE,
        body: NOTIFICATION_BODY,
        urgency: 'critical',
        icon: path.join(__dirname, '../assets/warning.png'), // Optional: add your icon
        sound: 'Glass', // Optional: add your sound
        silent: false
      }).show();

      


    } else {
      // Renderer process notification
      new window.Notification(NOTIFICATION_TITLE, {
        body: NOTIFICATION_BODY,
        silent: false
      }).onclick = () => {
        console.log('Threat notification clicked:', fileName);
      };
    }

    // Console fallback
    console.log(`\x1b[31m${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}\x1b[0m`);
  } catch (err) {
    console.error('Notification error:', err);
    // Fallback if notifications fail
    console.log(`\x1b[31m⚠️  Threat Alert: ${fileName} ${isQuarantined ? '(Quarantined)' : '(Quarantine Failed)'}\x1b[0m`);
  }
}

function showScanStartNotification(numFiles) {
  const NOTIFICATION_TITLE = '🔍 Scan Started';
  const NOTIFICATION_BODY = `Starting scan of ${numFiles} files...`;

  try {
    if (isMainProcess()) {
      const { Notification } = require('electron');
      new Notification({
        title: NOTIFICATION_TITLE,
        body: NOTIFICATION_BODY,
        icon: path.join(__dirname, '../assets/scan.png'),
        urgency: 'low',
        silent: true
      }).show();
    } else {
      new window.Notification(NOTIFICATION_TITLE, {
        body: NOTIFICATION_BODY,
        silent: true
      });
    }
    console.log(`\x1b[32m${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}\x1b[0m`);
  } catch (err) {
    console.log(`\x1b[32m${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}\x1b[0m`);
  }
}

function showScanCompleteNotification(numFiles, threatsFound) {
  const NOTIFICATION_TITLE = threatsFound > 0 ? '⚠️ Scan Complete' : '✅ Scan Complete';
  const NOTIFICATION_BODY = `Scanned ${numFiles} files.\n${
    threatsFound > 0 ? `Found ${threatsFound} threats!` : 'No threats found.'
  }`;

  try {
    if (isMainProcess()) {
      const { Notification } = require('electron');
      new Notification({
        title: NOTIFICATION_TITLE,
        body: NOTIFICATION_BODY,
        icon: path.join(__dirname, '../assets/complete.png'),
        urgency: threatsFound > 0 ? 'critical' : 'low',
        silent: false
      }).show();
    } else {
      new window.Notification(NOTIFICATION_TITLE, {
        body: NOTIFICATION_BODY,
        silent: false
      });
    }
    console.log(`\x1b[32m${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}\x1b[0m`);
  } catch (err) {
    console.log(`\x1b[32m${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}\x1b[0m`);
  }
}


function showWatcherStatus(isStarted) {
    const NOTIFICATION_TITLE = isStarted ? '🔍 Live Scanning Started' : '⚠️ Live Scanning Failed';
    const NOTIFICATION_BODY = isStarted ? 
      'Real-time file protection is now active' : 
      'Could not start real-time protection';
  
    try {
      if (isMainProcess()) {
        const { Notification } = require('electron');
        new Notification({
          title: NOTIFICATION_TITLE,
          body: NOTIFICATION_BODY,
          icon: path.join(__dirname, '../assets/scan.png'),
          urgency: isStarted ? 'low' : 'critical',
          silent: true
        }).show();
      } else {
        new window.Notification(NOTIFICATION_TITLE, {
          body: NOTIFICATION_BODY,
          silent: true
        });
      }
      console.log(`\x1b[32m${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}\x1b[0m`);
    } catch (err) {
      console.log(`\x1b[32m${NOTIFICATION_TITLE}: ${NOTIFICATION_BODY}\x1b[0m`);
    }
  }

module.exports = {
  showThreatNotification,
  showScanStartNotification,
  showScanCompleteNotification,
  showWatcherStatus
};
