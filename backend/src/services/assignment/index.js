// index.js
// Re-exports assignment services.

export {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from './editAssignment.service.js';
export { validateAssignment } from './validateAssignment.service.js';
export { listAssignments } from './listAssignments.service.js';
