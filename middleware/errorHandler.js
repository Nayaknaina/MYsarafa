module.exports = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.status || 500;
    let title = 'Server Error';
    let message = 'Something went wrong. Please try again later.';

    switch (statusCode) {
        case 400:
            title = 'Bad Request';
            message = err.message || 'The request could not be understood or was missing required parameters.';
            break;
        case 401:
            title = 'Unauthorized';
            message = err.message || 'You are not authorized to access this resource.';
            break;
        case 404:
            title = 'Not Found';
            message = err.message || 'The requested page could not be found.';
            break;
        case 403 :
            title = 'Forbidden';
            message = err.message || 'The server understood the request but refuses to authorize it';
            break;
        case 502 :
            title = 'Bad Gateway';
            message = err.message || 'The server, acting as a gateway or proxy, received an invalid response from an upstream server';
            break;
         case 500 :
            title = 'Bad Gateway';
            message = err.message || 'The server, acting as a gateway or proxy, received an invalid response from an upstream server';
            break;     
    }

    res.status(statusCode).render('error', {
        statusCode,
        title,
        errorMessage: message,
        layout: false
    });
};
