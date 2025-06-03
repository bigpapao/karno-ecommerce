// This file is now intentionally left blank.
// All indexes are managed by the Mongoose model definitions.

// Database indexes are now managed by Mongoose model definitions.
// This file is kept for backward compatibility but does not create any indexes.

export const createIndexes = async () =>
  // No-op function - indexes are created by Mongoose models
  ({ success: true, message: 'Indexes managed by Mongoose models' });
export default { createIndexes };
