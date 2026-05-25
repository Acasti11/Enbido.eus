package com.mus.backend.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PostalCodeESValidator implements ConstraintValidator<PostalCodeES, String> {

    @Override
    public boolean isValid(String postalCode, ConstraintValidatorContext context) {
        if (postalCode == null || postalCode.isBlank()) return true;
        return postalCode.matches("^\\d{5}$");
    }
}
