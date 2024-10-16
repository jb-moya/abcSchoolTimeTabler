import { openDB } from 'idb';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const DB_NAME = 'abcTimetable';
const DB_VERSION = 1;

export const STORE_NAMES = {
  SUBJECTS: 'subjects',
  TEACHERS: 'teachers',
  SECTIONS: 'sections',
  PROGRAMS: 'programs',
};

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, {
            keyPath: 'id',
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
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    const key = await store.put({ ...entity }); // `add` automatically generates the key
    await tx.done;

    return key;
  } catch (error) {
    toast.error('Failed to add entity to DB');
  }
};

export const editEntityFromDB = async (storeName, entityId, updatedEntity) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    const existingEntity = await store.get(entityId);
    if (!existingEntity) {
      throw new Error('Entity not found');
    }

    // console.log("Updating entity in store: ", storeName);
    // console.log("Updating entity with ID: ", entityId);
    // console.log("Updating entity with new values:", updatedEntity);

    const updated = { ...existingEntity, ...updatedEntity };
    await store.put(updated);
    await tx.done;

    // console.log("Entity updated with ID:", entityId);
    return entityId;
  } catch (error) {
    // console.error("Error updating entity in DB:", error);
    toast.error('Failed to update entity in DB');
  }
};

export const removeEntityFromDB = async (storeName, entityId) => {
  try {
    const db = await initDB();

    const tx = db.transaction([STORE_NAMES.TEACHERS, STORE_NAMES.SECTIONS, STORE_NAMES.PROGRAMS, storeName], 'readonly');
    const teachersStore = tx.objectStore(STORE_NAMES.TEACHERS);
    const sectionsStore = tx.objectStore(STORE_NAMES.SECTIONS);
    const programsStore = tx.objectStore(STORE_NAMES.PROGRAMS);

    if (storeName === STORE_NAMES.SUBJECTS) {
      const teachers = await teachersStore.getAll();
      const teacherDependent = teachers.find((teacher) =>
        teacher.subjects.includes(entityId)
      );

      const sections = await sectionsStore.getAll();
      const sectionDependent = sections.find((section) =>
        Object.keys(section.subjects).includes(entityId.toString())
      );

      const programs = await programsStore.getAll();
      const programDependent = programs.find((program) =>
        Object.values(program).some((gradeLevel) => {
          if (gradeLevel.subjects && Array.isArray(gradeLevel.subjects)) {
            return gradeLevel.subjects.includes(entityId);
          }
          return false;
        })
      );

      if (teacherDependent || sectionDependent || programDependent) {
        toast.error(
          'Cannot delete subject as it is referenced by teachers, sections, or programs.'
        );
        throw new Error(
          'Dependency Error: Subject is referenced by teachers, sections, or programs.'
        );
      }
    } else if (storeName === STORE_NAMES.PROGRAMS) {
      const sections = await sectionsStore.getAll();
      const sectionDependent = sections.find((section) =>
        section.program === entityId
      );

      if (sectionDependent) {
        toast.error('Cannot delete program as it is referenced by sections.');
        throw new Error('Dependency Error: Program is referenced by sections.');
      }
      
    } else if (storeName === STORE_NAMES.TEACHERS) {
      const sections = await sectionsStore.getAll();
      const sectionDependent = sections.find((section) =>
        section.teacher === entityId
      );

      if (sectionDependent) {
        toast.error('Cannot delete teacher as it is referenced by sections.');
        throw new Error('Dependency Error: Teacher is referenced by sections.');
      }
      
    }

    // console.log("pumupunta pa rin ba rito?");

    const deleteTx = db.transaction(storeName, 'readwrite');
    const store = deleteTx.objectStore(storeName);
    await store.delete(entityId);

    // console.log("eh dito?");

    toast.success('Entity removed successfully');
    return true;

  } catch (error) {
    if (error.message.includes('Dependency Error')) {
      console.warn('Dependency error: ', error.message);
    } else {
      toast.error('Failed to remove entity from DB');
    }

    return false;
  }
};

export const getAllEntitiesFromDB = async (storeName) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  const entity = {};
  for await (const cursor of store) {
    entity[cursor.value.id] = cursor.value;
  }

  await tx.done;

  return entity;
};

export const clearAllEntriesAcrossStores = async () => {
  const db = await initDB();
  const storeNames = Object.values(STORE_NAMES);
  for (const storeName of storeNames) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
  }
};

export const exportIndexedDB = (dbName) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => {
      reject('Error opening IndexedDB');
    };
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(db.objectStoreNames, 'readonly');
      const exportData = {};
      let objectStoresProcessed = 0;

      for (const storeName of db.objectStoreNames) {
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
          exportData[storeName] = event.target.result;
          objectStoresProcessed++;
          if (objectStoresProcessed === db.objectStoreNames.length) {
            resolve(exportData);
          }
        };
        request.onerror = () => {
          reject(`Error exporting store: ${storeName}`);
        };
      }
    };
  });
};

export const importIndexedDB = (dbName, jsonData) => {
  const importData = JSON.parse(jsonData);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => {
      reject('Error opening IndexedDB');
    };
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(db.objectStoreNames, 'readwrite');

      for (const storeName in importData) {
        const store = transaction.objectStore(storeName);
        importData[storeName].forEach((item) => {
          store.put(item);
        });
      }

      transaction.oncomplete = () => {
        resolve('Import complete');
      };
      transaction.onerror = () => {
        reject('Error importing data');
      };
    };
  });
};

export const downloadData = (jsonData, fileName) => {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const loadFile = (format) => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = format === "excel" ? ".xlsx, .xls" : ".json";
    
    input.onchange = (event) => {
      const file = event.target.files[0];

      if (!file) {
        reject("No file selected");
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const data = e.target.result;

        if (format === "json") {
          resolve(data);
        } else if (format === "excel") {
          try {
            const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
            const allSheetsData = {};

            // Iterate over all sheet names in the workbook
            workbook.SheetNames.forEach((sheetName) => {
              const sheet = workbook.Sheets[sheetName];
              const sheetData = XLSX.utils.sheet_to_json(sheet);
              allSheetsData[sheetName] = sheetData;
            });

            resolve(allSheetsData);
          } catch (error) {
            reject("Invalid Excel file");
          }
        }
      };

      if (format === "json") {
        reader.readAsText(file);
      } else if (format === "excel") {
        reader.readAsArrayBuffer(file);
      }
    };

    input.click();
  });
};

