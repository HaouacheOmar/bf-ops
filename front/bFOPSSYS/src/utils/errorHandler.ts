export const getErrorMessage = (error: any, defaultMsg: string = 'Unknown error') => {
  if (error && error.response && error.response.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    if (typeof data === 'object') {
      const errors = Object.keys(data).map(key => {
        const val = data[key];
        const msg = Array.isArray(val) ? val.join(', ') : String(val);
        return key + ': ' + msg;
      });
      return errors.join('\n');
    }
  }
  return (error && error.message) ? error.message : defaultMsg;
};
