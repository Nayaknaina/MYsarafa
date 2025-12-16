module.exports = (err, req, res, next) => {
    console.error(err.stack);

   const statusCode = err.statusCode || err.status || 500;
    let title = 'Server Error';
    let message = 'Something went wrong. Please try again later.';

       
    const sensitiveKeywords = [
        'jwt', 'token', 'unauthorized',
        'database', 'ECONN', 'EADDR', 'TypeError',
        'ReferenceError', 'SyntaxError'
    ];

    const isSensitive =
        err.message &&
        sensitiveKeywords.some(k =>
            err.message.toLowerCase().includes(k.toLowerCase())
        );

   switch (statusCode) {
        case 400:
            title = 'Bad Request';
          
            message = !isSensitive
                ? (err.message || 'Your request was invalid. Please check and try again.')
                : 'The request could not be processed due to invalid input.';
            break;

        case 401:
            title = 'Unauthorized';
            message = 'Your session has expired or you are not authorized to access this resource.';
            break;

        case 403:
            title = 'Forbidden';
            message = !isSensitive
                ? (err.message || 'You do not have permission to perform this action.')
                : 'Access denied. You do not have permission to access this resource.';
            break;

        case 404:
            title = 'Not Found';
            message = !isSensitive
                ? (err.message || 'The page you are looking for could not be found.')
                : 'The requested page could not be found.';
            break;

        case 408:
            title = 'Request Timeout';
            message = 'The request took too long. Please try again.';
            break;

        case 429:
            title = 'Too Many Requests';
            message = 'You have made too many requests. Please wait and try again later.';
            break;

        case 500:
            title = 'Internal Server Error';
            message = 'Something went wrong on our end. Please try again later.';
            break;

        case 502:
            title = 'Bad Gateway';
            message = 'The server received an invalid response from an upstream server.';
            break;

        case 503:
            title = 'Service Unavailable';
            message = 'Our service is temporarily unavailable. Please try again shortly.';
            break;

        default:
            title = 'Unexpected Error';
            message = !isSensitive
                ? (err.message || 'An unknown error occurred.')
                : 'An unexpected issue occurred. Please try again later.';
            break;
    }


    res.status(statusCode).render('error', {
        statusCode,
        title,
        errorMessage: message,
        layout: false
    });
};
