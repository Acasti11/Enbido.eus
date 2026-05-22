package com.mus.backend.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PostalCodeESValidator.class)
public @interface PostalCodeES {
    String message() default "Postal code must be exactly 5 digits (01000-52999)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
