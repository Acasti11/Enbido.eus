package com.mus.backend.dto;

public class LoginResponseDto {
    private boolean twoFactorRequired;
    private Long tempUserId;

    public LoginResponseDto() {}

    public LoginResponseDto(boolean twoFactorRequired, Long tempUserId) {
        this.twoFactorRequired = twoFactorRequired;
        this.tempUserId = tempUserId;
    }

    public boolean isTwoFactorRequired() { return twoFactorRequired; }
    public void setTwoFactorRequired(boolean twoFactorRequired) { this.twoFactorRequired = twoFactorRequired; }
    public Long getTempUserId() { return tempUserId; }
    public void setTempUserId(Long tempUserId) { this.tempUserId = tempUserId; }
}
