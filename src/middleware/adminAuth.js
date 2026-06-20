const adminAuth = (req, res, next) => {
    const key = req.headers["x-admin-key"];

    if (key !== process.env.ADMIN_SECRET) {
        return res.status(403).json({
            message: "Unauthorized"
        });
    }

    next();
};

export default adminAuth;