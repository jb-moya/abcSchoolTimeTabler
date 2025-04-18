// utils/logFormatter.js
import { ABBREVIATION_COLLECTION } from '../constants';
import { ABBREVIATION_OPERATION } from '../constants';

export const formatLog = (logData) => {
    const { id, ...data } = logData;
    const rawDescriptor = data?.d ?? '-';
    const split = rawDescriptor.split('-');

    const abbrevCollection = split?.[0] ?? '-';
    const abbrevOperation = split?.[1] ?? '-';

    const collectionName = ABBREVIATION_COLLECTION[abbrevCollection] ?? 'an unknown collection';
    const operationName = ABBREVIATION_OPERATION[abbrevOperation] ?? 'did something on';
    const username = data?.u ?? 'Unknown User';
    const item = data?.i ?? 'unknown item';

    return {
        id,
        collectionName,
        operation: operationName,
        item,
        date: data.t,
        username,
    };
};
