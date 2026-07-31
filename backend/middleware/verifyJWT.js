import jwt from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
    const token = req.cookies.token;

    // If user doesn't send a token with them or if the token is modified by malicious user, then deny their access
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'TEmporarYYY_secret_key_here=2818391023809129300$*()!*)(#KJDSKLJDALSKJ');

        // Attach decoded payload to request object (in this case, it's { id: user.id })
        req.user = verified;

        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or Expired Token!' });
    }

    next();
};

export default verifyJWT;