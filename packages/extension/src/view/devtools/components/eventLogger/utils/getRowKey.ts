export const getRowKey = (name: string, time: string) => {
  const _time = time ? time.replaceAll(':', '-') : '';
  return `${name}-${_time}`;
};
