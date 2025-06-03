import Joi from 'joi';

/**
 * Validator middleware for user registration
 * Validates request body against schema and returns appropriate error messages
 */
export const validateRegister = (req, res, next) => {
  // Define validation schema using Joi
  const schema = Joi.object({
    firstName: Joi.string().min(3).max(30).required()
      .messages({
        'string.min': 'نام باید حداقل 3 کاراکتر باشد',
        'string.max': 'نام نباید بیشتر از 30 کاراکتر باشد',
        'any.required': 'نام الزامی است',
      }),

    lastName: Joi.string().min(3).max(30).required()
      .messages({
        'string.min': 'نام خانوادگی باید حداقل 3 کاراکتر باشد',
        'string.max': 'نام خانوادگی نباید بیشتر از 30 کاراکتر باشد',
        'any.required': 'نام خانوادگی الزامی است',
      }),

    email: Joi.string().email().messages({
      'string.email': 'فرمت ایمیل نامعتبر است',
    }),

    mobile: Joi.string().pattern(/^09\d{9}$/).messages({
      'string.pattern.base': 'شماره موبایل باید 11 رقم و با فرمت 09XXXXXXXXX باشد',
    }),

    phone: Joi.string().pattern(/^09\d{9}$/).messages({
      'string.pattern.base': 'شماره موبایل باید 11 رقم و با فرمت 09XXXXXXXXX باشد',
    }),

    password: Joi.string().min(8).pattern(/.*[0-9].*/).required()
      .messages({
        'string.min': 'رمز عبور باید حداقل 8 کاراکتر باشد',
        'string.pattern.base': 'رمز عبور باید حداقل شامل یک عدد باشد',
        'any.required': 'رمز عبور الزامی است',
      }),

    sessionId: Joi.string().guid({ version: 'uuidv4' }).allow('', null).messages({
      'string.guid': 'شناسه جلسه باید در فرمت UUID نسخه 4 باشد',
    }),

    role: Joi.string().valid('user', 'admin').default('user'),
  }).or('email', 'mobile', 'phone').messages({
    'object.missing': 'حداقل یکی از فیلدهای ایمیل یا شماره موبایل باید وارد شود',
  });

  // Validate request body against schema
  const { error } = schema.validate(req.body, { abortEarly: false });

  // If validation error exists, return 422 with formatted errors
  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path[0],
      msg: detail.message,
    }));

    return res.status(422).json({
      status: 'error',
      message: 'خطا در اعتبارسنجی اطلاعات',
      errors,
    });
  }

  // If validation passes, proceed to next middleware/controller
  next();
};

export default validateRegister;
