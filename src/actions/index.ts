import {
  addOrUpdateItem,
  createResumeProject,
  deleteItem,
  deleteResumeProject,
  getResumeProject,
  listResumeProjects,
  resumeUpdateProjectPhoto,
  setDefaultResumeProject,
  updateResumeProject,
  upsertSection,
} from "./resumeBuilder";

export const resumeBuilder = {
  listResumeProjects,
  createResumeProject,
  getResumeProject,
  updateResumeProject,
  resumeUpdateProjectPhoto,
  deleteResumeProject,
  setDefaultResumeProject,
  upsertSection,
  addOrUpdateItem,
  deleteItem,
};

export const server = {
  resumeBuilder,
};
