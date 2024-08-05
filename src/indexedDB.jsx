import { openDB } from "idb";
import { toast } from "sonner";

const DB_NAME = "abcTimetable";
const DB_VERSION = 1;
export const STORE_NAMES = {
    SUBJECTS: "subjects",
    TEACHERS: "teachers",
    SECTIONS: "sections",
};

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            Object.values(STORE_NAMES).forEach((storeName) => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                }
            });
        },
    });
};

export const addEntityToDB = async (storeName, entity, entityFieldName) => {
    try {
        const db = await initDB();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        const key = await store.put({ [entityFieldName]: entity }); // `add` automatically generates the key
        await tx.done;

        console.log("Entity added with key:", key);
        return key;
    } catch (error) {
        console.error("Error adding entity to DB:", error);
        toast.error("Failed to add entity to DB");
    }
};

// Remove an entity from the specified store by ID
export const removeEntityFromDB = async (storeName, entityId) => {
    try {
        const db = await initDB();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        console.log(entityId);
        console.log(
            `Deleting entity with ID: ${entityId} (Type: ${typeof entityId})`
        );

        await store.delete(entityId);
    } catch (error) {
        console.error("Error adding entity to DB:", error);
        toast.error("Failed to add entity to DB");
    }
};

// Get all entities from the specified store
export const getAllEntitiesFromDB = async (storeName) => {
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    const entity = {};
    for await (const cursor of store) {
        console.log(cursor.value);
        entity[cursor.value.id] = cursor.value;
    }

    await tx.done;

    return entity;
};
