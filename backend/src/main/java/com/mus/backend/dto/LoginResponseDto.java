package com.mus.backend.dto;

public class LoginResponseDto {
    private boolean twoFactorRequired;
    private Long tempUserId;
    private String accessToken;

    public LoginResponseDto() {}

    public LoginResponseDto(boolean twoFactorRequired, Long tempUserId, String accessToken) {
        this.twoFactorRequired = twoFactorRequired;
        this.tempUserId = tempUserId;
        this.accessToken = accessToken;
    }

    // Getters and Setters
    public boolean isTwoFactorRequired() { return twoFactorRequired; }
    public void setTwoFactorRequired(boolean twoFactorRequired) { this.twoFactorRequired = twoFactorRequired; }
    public Long getTempUserId() { return tempUserId; }
    public void setTempUserId(Long tempUserId) { this.tempUserId = tempUserId; }
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
}
