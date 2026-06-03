package com.mus.backend.event;

import org.springframework.context.ApplicationEvent;
import java.util.Map;

public class FriendshipEvent extends ApplicationEvent {
    private final Long userId;
    private final Map<String, Object> data;

    public FriendshipEvent(Object source, Long userId, Map<String, Object> data) {
        super(source);
        this.userId = userId;
        this.data = data;
    }

    public Long getUserId() {
        return userId;
    }

    public Map<String, Object> getData() {
        return data;
    }
}
