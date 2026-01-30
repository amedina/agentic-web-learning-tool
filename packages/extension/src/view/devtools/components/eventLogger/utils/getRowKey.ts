export const getRowKey = (name: string, time: string) => {
  const _time = time ? String(time).replace(/:/g, '-') : '';
  return `${name}-${_time}`;
};
