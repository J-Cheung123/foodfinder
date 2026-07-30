// A temporary middleware to fake a logged-in user
export const mockAuth = (req, res, next) => {
    // Hardcode this to the ID
    req.user = { userId: 1 };
    next();
};