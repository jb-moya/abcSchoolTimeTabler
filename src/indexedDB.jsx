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

export const addEntityToDB = async (storeName, entity) => {
    try {
        const db = await initDB();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        const key = await store.put({ ...entity }); // `add` automatically generates the key
        await tx.done;

        console.log("Entity added with key:", key);
        return key;
    } catch (error) {
        console.error("Error adding entity to DB:", error);
        toast.error("Failed to add entity to DB");
    }
};

// Edit an existing entity in the specified store by ID
export const editEntityFromDB = async (storeName, entityId, updatedEntity) => {
    try {
        const db = await initDB();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        const existingEntity = await store.get(entityId);
        if (!existingEntity) {
            throw new Error("Entity not found");
        }

        console.log("Updating entity in store: ", storeName);
        console.log("Updating entity with ID: ", entityId);
        console.log("Updating entity with new values:", updatedEntity);

        const updated = { ...existingEntity, ...updatedEntity };
        await store.put(updated);
        await tx.done;

        console.log("Entity updated with ID:", entityId);
        return entityId;
    } catch (error) {
        console.error("Error updating entity in DB:", error);
        toast.error("Failed to update entity in DB");
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
