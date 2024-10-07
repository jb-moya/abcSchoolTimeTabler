import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  addEntityToDB,
  removeEntityFromDB,
  getAllEntitiesFromDB,
  editEntityFromDB,
  STORE_NAMES,
} from '../indexedDB';
import { editSection } from './sectionSlice';

const initialState = {
  programs: {}, // Change from array to object
  status: 'idle',
  error: null,
};

export const fetchPrograms = createAsyncThunk(
  'program/fetchPrograms',
  async () => {
    const programs = await getAllEntitiesFromDB(STORE_NAMES.PROGRAMS);
    return programs;
  }
);

export const addProgram = createAsyncThunk(
  'program/addProgram',
  async (program, { dispatch }) => {
    const key = await addEntityToDB(STORE_NAMES.PROGRAMS, program);
    dispatch(programSlice.actions.addProgramSync({ ...program, id: key }));
  }
);

export const editProgram = createAsyncThunk(
  'program/editProgram',
  async ({ programId, updatedProgram }, { dispatch }) => {
    await editEntityFromDB(STORE_NAMES.PROGRAMS, programId, updatedProgram);
    dispatch(
      programSlice.actions.editProgramSync({
        id: programId,
        ...updatedProgram,
      })
    );
  }
);

export const removeProgram = createAsyncThunk(
  'program/removeProgram',
  async (programId, { dispatch }) => {
    await removeEntityFromDB(STORE_NAMES.PROGRAMS, programId);
    dispatch(programSlice.actions.removeProgramSync(programId));
  }
);

export const updateSectionsForProgramYear = createAsyncThunk(
  'sections/updateSectionsForProgramYear',
  async ({ programId, yearLevel, newSubjects }, { getState, dispatch }) => {
    const state = getState(); // Get the entire state
    const sections = state.section.sections; // Access sections from the state

    // Filter sections that belong to the updated program and year level
    const updatedSectionsArray = Object.values(sections).map((section) => {
      if (section.program === programId && section.year === yearLevel) {
        const updatedSubjects = { ...section.subjects }; // Keep original subjects

        console.log(
          `Updating section with ID: ${section.id}, program: ${programId}, year level: ${yearLevel}`
        );

        // Add or update subjects based on newSubjects array
        newSubjects.forEach((subjectId) => {
          if (!(subjectId in updatedSubjects)) {
            // Add new subject with units set to 0
            updatedSubjects[subjectId] = 0;
          }
        });

        // Remove subjects that are no longer in the updated list
        Object.keys(updatedSubjects).forEach((existingSubjectId) => {
          if (!newSubjects.includes(parseInt(existingSubjectId))) {
            delete updatedSubjects[existingSubjectId];
          }
        });

        return {
          ...section,
          subjects: updatedSubjects,
        };
      }
      return section;
    });

    const updatedSections = updatedSectionsArray.reduce((acc, section) => {
      acc[section.id] = section; // Assuming `id` is unique
      return acc;
    }, {});

    updatedSectionsArray.forEach((section) => {
      if (section.program === programId && section.year === yearLevel) {
        dispatch(
          editSection({
            sectionId: section.id,
            updatedSection: {
              id: section.id,
              program: section.program,
              section: section.section,
              subjects: section.subjects,
              year: section.year,
            },
          })
        );
      }
    });
  }
);

export const programSlice = createSlice({
  name: 'program',
  initialState,
  reducers: {
    addProgramSync: (state, action) => {
      const program = action.payload;
      state.programs[program.id] = program;
    },
    editProgramSync: (state, action) => {
      const updatedProgram = action.payload;
      state.programs[updatedProgram.id] = {
        ...state.programs[updatedProgram.id],
        ...updatedProgram,
      };
    },
    removeProgramSync: (state, action) => {
      const programId = action.payload;
      delete state.programs[programId];
    },
    setUpdatedSections: (state, action) => {
      state.sections = action.payload; // Replace the old sections with updated ones
    },
    setStatusIdle: (state) => {
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrograms.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.programs = action.payload;
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const {
  addProgramSync,
  editProgramSync,
  removeProgramSync,
  setUpdatedSections,
  setStatusIdle: setProgramStatusIdle,
} = programSlice.actions;

export default programSlice.reducer;
