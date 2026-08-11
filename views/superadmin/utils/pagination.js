exports.getPagination = (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};