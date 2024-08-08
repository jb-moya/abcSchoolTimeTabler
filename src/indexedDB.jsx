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

        return key;
    } catch (error) {
        toast.error("Failed to add entity to DB");
    }
};

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

export const removeEntityFromDB = async (storeName, entityId) => {
    try {
        const db = await initDB();

        if (storeName === STORE_NAMES.SUBJECTS) {
            // Check if any teachers or sections reference this subject
            const teachersTx = db.transaction(STORE_NAMES.TEACHERS, "readonly");
            const teachersStore = teachersTx.objectStore(STORE_NAMES.TEACHERS);
            const teachers = await teachersStore.getAll();
            const teacherDependent = teachers.find((teacher) =>
                teacher.subjects.includes(entityId)
            );

            const sectionsTx = db.transaction(STORE_NAMES.SECTIONS, "readonly");
            const sectionsStore = sectionsTx.objectStore(STORE_NAMES.SECTIONS);
            const sections = await sectionsStore.getAll();
            const sectionDependent = sections.find((section) =>
                section.subjects.includes(entityId)
            );

            if (teacherDependent || sectionDependent) {
                toast.error(
                    "Cannot delete subject as it is referenced by teachers or sections."
                );
                throw new Error(
                    "Dependency Error: Subject is referenced by teachers or sections."
                );
            }
        }

        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        await store.delete(entityId);

        toast.success("Entity removed successfully");
        return true;
    } catch (error) {
        if (error.message.includes("Dependency Error")) {
            console.warn("Dependency error: ", error.message);
        } else {
            toast.error("Failed to remove entity from DB");
        }

        return false;
    }
};

export const getAllEntitiesFromDB = async (storeName) => {
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    const entity = {};
    for await (const cursor of store) {
        entity[cursor.value.id] = cursor.value;
    }

    await tx.done;

    return entity;
};
