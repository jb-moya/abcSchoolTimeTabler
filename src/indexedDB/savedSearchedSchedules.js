import { openDB } from "idb";

// MyService.js
class Schedules {
    constructor() {
        if (Schedules.instance) {
            return Schedules.instance;
        }

        // your init code here
        // this.db = await openDB

        Schedules.instance = this;
    }

    log(msg) {
        console.log(`[${this.timestamp}] ${msg}`);
    }
}

const myServiceInstance = new Schedules();
export default myServiceInstance;
