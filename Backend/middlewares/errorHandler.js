
const SAFE_MESSAGES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable'
};

function getErrorDetails(err) {
  if (err?.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation failed'
    };
  }

  if (err?.code === 11000) {
    return {
      statusCode: 409,
      message: 'A record with this value already exists'
    };
  }

  if (err?.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid identifier or value'
    };
  }

  if (
    err?.name === 'TokenExpiredError' ||
    err?.name === 'JsonWebTokenError' ||
    err?.name === 'NotBeforeError'
  ) {
    return {
      statusCode: 401,
      message: 'Invalid or expired authentication token'
    };
  }

  if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return {
        statusCode: 413,
        message: 'Uploaded file is too large'
      };
    }

    return {
      statusCode: 400,
      message: 'Invalid file upload'
    };
  }

  const candidateStatus = Number.isInteger(err?.statusCode)
    ? err.statusCode
    : Number.isInteger(err?.status)
      ? err.status
      : 500;

  const statusCode =
    candidateStatus >= 400 && candidateStatus <= 599
      ? candidateStatus
      : 500;

  return {
    statusCode,
    message: SAFE_MESSAGES[statusCode] || 'Request failed'
  };
}

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const { statusCode, message } = getErrorDetails(err);
  const isProduction = process.env.NODE_ENV === 'production';

  // Ha log-gareyn passwords, tokens, request bodies ama secrets.
  console.error('Request error:', {
    method: req.method,
    path: req.path,
    statusCode,
    errorName: err?.name || 'Error',
    errorCode:
      typeof err?.code === 'string' ||
      typeof err?.code === 'number'
        ? err.code
        : undefined,
    ...(isProduction
      ? {}
      : {
          errorMessage: err?.message,
          stack: err?.stack
        })
  });

  const responseMessage = isProduction
    ? message
    : (err?.message || message);

  return res.status(statusCode).json({
    success: false,
    error: responseMessage
  });
};

export { errorHandler };

