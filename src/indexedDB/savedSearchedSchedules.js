import { openDB } from 'idb';

const levenshtein = (s, t) => {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) {
        arr[i] = [i];
        for (let j = 1; j <= s.length; j++) {
            arr[i][j] =
                i === 0 ? j : Math.min(arr[i - 1][j] + 1, arr[i][j - 1] + 1, arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1));
        }
    }
    return arr[t.length][s.length];
};

// console.log('test', levenshtein('duck', 'dark')); // 2
// console.log('test', levenshtein('foo', 'foobar')); // 3
// console.log('test', levenshtein('sect', 'section3')); // 3
// console.log('test', levenshtein('Jo', 'Joshua Buenaventura')); // 3
// console.log('test', levenshtein('', 'Joshua Buenaventura')); // 3
// console.log('test', levenshtein('', 'Joshua Buenaventura')); // 3

export default class Schedules {
    static db = null;
    static nameIDs = [];
    static _initialized = false;

    static async init() {
        if (this._initialized) return;

        this.db = await openDB('schedules', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('schedules')) {
                    const store = db.createObjectStore('schedules', { keyPath: 'id' });
                    store.createIndex('by_name', 'nameID', { unique: true });
                }
            },
        });

        const schedules = await this.getAll();
        this.nameIDs = schedules.map((schedule) => schedule.nameID);
        this._initialized = true;
    }

    static async getAll() {
        if (!this.db) throw new Error('Schedules not initialized');
        const tx = this.db.transaction('schedules', 'readonly');
        const store = tx.objectStore('schedules');
        const schedules = await store.getAll();
        await tx.done;
        return schedules;
    }

    static async upsert(schedule) {
        if (!this._initialized) throw new Error('Schedules not initialized');

        schedule.nameID = Array.isArray(schedule?.n) ? schedule.n.join(' ') : '';

        if (!schedule.nameID) return;

        const tx = this.db.transaction('schedules', 'readwrite');
        const store = tx.objectStore('schedules');
        await store.put(schedule);
        await tx.done;

        // Update nameIDs if new
        if (!this.nameIDs.includes(schedule.nameID)) {
            this.nameIDs.push(schedule.nameID);
        }
    }

    static getAllNames() {
        return this.nameIDs;
    }

    static searchNames(query, threshold = 20) {
        query = query.toLowerCase();

        return this.nameIDs.filter((name) => {
            const distance = levenshtein(query, name.toLowerCase());
            return distance <= threshold;
        });
    }

    static async getSchedulesByFuzzyName(query) {
        if (!this._initialized) throw new Error('Schedules not initialized');

        const matchedNames = this.searchNames(query);
        const tx = this.db.transaction('schedules', 'readonly');
        const store = tx.objectStore('schedules');
        const schedules = [];

        for (const name of matchedNames) {
            const index = store.index('by_name');
            const matchedSchedule = await index.get(name);
            if (matchedSchedule) {
                schedules.push(matchedSchedule);
            }
        }

        await tx.done;
        return schedules;
    }
}
