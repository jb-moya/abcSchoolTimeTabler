export const filterObject = (obj, predicate) =>
    Object.fromEntries(Object.entries(obj).filter(predicate));
