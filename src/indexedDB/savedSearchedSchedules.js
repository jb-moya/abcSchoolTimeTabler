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

console.log("test", levenshtein('duck', 'dark')); // 2
console.log("test", levenshtein('foo', 'foobar')); // 3
console.log("test", levenshtein('sect', 'section3')); // 3
console.log("test", levenshtein('Jo', 'Joshua Buenaventura')); // 3
console.log("test", levenshtein('', 'Joshua Buenaventura')); // 3
console.log("test", levenshtein('', 'Joshua Buenaventura')); // 3

class Schedules {
    constructor(db) {
        if (Schedules.instance) {
            return Schedules.instance;
        }

        this.db = db;
        Schedules.instance = this;
        this.nameIDs = [];
    }

    async getAll() {
        const tx = this.db.transaction('schedules', 'readonly');
        const store = tx.objectStore('schedules');
        const schedules = await store.getAll();
        await tx.done;
        return schedules;
    }

    static async init() {
        if (!Schedules.instance) {
            const db = await openDB('schedules', 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('schedules')) {
                        const store = db.createObjectStore('schedules', { keyPath: 'id' });
                        store.createIndex('by_name', 'nameID', { unique: true });
                    }
                },
            });
            Schedules.instance = new Schedules(db);

            const schedules = await Schedules.instance.getAll();

            const names = schedules.map((schedule) => schedule.nameID);

            Schedules.instance.nameIDs = names;
        }
        return Schedules.instance;
    }

    async upsert(schedule) {
        schedule.nameID = Array.isArray(schedule?.n) ? schedule.n.join(' ') : '';

        if (schedule?.nameID === '') {
            return;
        }

        const tx = this.db.transaction('schedules', 'readwrite');
        const store = tx.objectStore('schedules');
        await store.put(schedule);
        await tx.done;
    }

    getAllNames() {
        return this.nameIDs;
    }

    searchNames(query, threshold = 20) {
        query = query.toLowerCase();

        console.log('🚀 ~ Schedules ~ searchNames ~ query:', query);
        console.log('🚀 ~ Schedules ~ returnthis.nameIDs.filter ~ this.nameIDs:', this.nameIDs);

        return this.nameIDs.filter((name) => {
            const distance = levenshtein(query, name.toLowerCase());
            return distance <= threshold;
        });
    }

    async getSchedulesByFuzzyName(query) {
        const matchedNames = this.searchNames(query);
        console.log('🚀 ~ Schedules ~ getSchedulesByFuzzyName ~ matchedNames:', matchedNames);

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

const schedules = await Schedules.init();
export default schedules;
