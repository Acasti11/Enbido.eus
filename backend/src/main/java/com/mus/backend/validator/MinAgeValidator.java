package com.mus.backend.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;

public class MinAgeValidator implements ConstraintValidator<<MinAge, LocalDate> {

    private int minAge;

    @Override
    public void initialize(MinAge constraint) {
        this.minAge = constraint.value();
    }

    @Override
    public boolean isValid(LocalDate birthDate, ConstraintValidatorContext context) {
        if (birthDate == null) return true;
        return birthDate.isBefore(LocalDate.now().minusYears(minAge));
    }
}
