function isMainProcess() {
  try {
    return process.type === 'browser' || !process.type;
  } catch {
    return true;
  }
}

module.exports = {
  isMainProcess
};
