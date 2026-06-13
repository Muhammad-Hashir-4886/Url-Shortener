export const successResponse = (data, message = 'Success', statusCode = 200) => ({
    success: true,
    message,
    data,
    statusCode,
});

export const errorResponse = (message, statusCode = 400, errors = null) => ({
    success: false,
    message,
    errors,
    statusCode,
});

export const paginatedResponse = (data, page, limit, total) => ({
    success: true,
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
    },
});