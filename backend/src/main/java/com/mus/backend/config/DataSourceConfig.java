package com.mus.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DataSourceConfig {

    public enum DataSourceType {
        PRIMARY, REPLICA
    }

    public static class TransactionRoutingDataSource extends AbstractRoutingDataSource {
        @Override
        protected Object determineCurrentLookupKey() {
            boolean isReadOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
            return isReadOnly ? DataSourceType.REPLICA : DataSourceType.PRIMARY;
        }
    }

    // =========================================================================
    // Default / Fallback DataSource properties (from spring.datasource)
    // =========================================================================
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSourceProperties defaultDataSourceProperties() {
        return new DataSourceProperties();
    }

    // =========================================================================
    // Primary DataSource configuration using standard DataSourceProperties
    // =========================================================================
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.primary.hikari")
    public HikariDataSource primaryDataSource(
            DataSourceProperties primaryDataSourceProperties,
            DataSourceProperties defaultDataSourceProperties,
            Environment env) {
        
        return createHikariDataSource(
                primaryDataSourceProperties,
                defaultDataSourceProperties,
                "spring.datasource.primary",
                env
        );
    }

    // =========================================================================
    // Replica DataSource configuration using standard DataSourceProperties
    // =========================================================================
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.replica")
    public DataSourceProperties replicaDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.replica.hikari")
    public HikariDataSource replicaDataSource(
            DataSourceProperties replicaDataSourceProperties,
            DataSourceProperties primaryDataSourceProperties,
            DataSourceProperties defaultDataSourceProperties,
            Environment env) {
        
        // If replica properties are not set, we fall back to primary properties,
        // which themselves fall back to default properties.
        return createHikariDataSource(
                replicaDataSourceProperties,
                primaryDataSourceProperties,
                "spring.datasource.replica",
                env
        );
    }

    // =========================================================================
    // Routing DataSource wrapped in LazyConnectionDataSourceProxy
    // =========================================================================
    @Bean
    @Primary
    public DataSource dataSource(
            HikariDataSource primaryDataSource,
            HikariDataSource replicaDataSource) {
        
        TransactionRoutingDataSource routingDataSource = new TransactionRoutingDataSource();
        
        Map<Object, Object> dataSourceMap = new HashMap<>();
        dataSourceMap.put(DataSourceType.PRIMARY, primaryDataSource);
        dataSourceMap.put(DataSourceType.REPLICA, replicaDataSource);
        
        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource);
        routingDataSource.afterPropertiesSet();
        
        return new LazyConnectionDataSourceProxy(routingDataSource);
    }

    // =========================================================================
    // Helper to create HikariDataSource with fallbacks
    // =========================================================================
    private HikariDataSource createHikariDataSource(
            DataSourceProperties properties,
            DataSourceProperties fallbackProperties,
            String prefix,
            Environment env) {
        
        String url = properties.getUrl();
        if (url == null || url.trim().isEmpty()) {
            url = env.getProperty(prefix + ".jdbc-url");
        }
        if (url == null || url.trim().isEmpty()) {
            url = fallbackProperties.getUrl();
        }
        
        // Check if there is a global spring.datasource url to fall back to
        String globalUrl = env.getProperty("spring.datasource.url");
        if (globalUrl == null || globalUrl.trim().isEmpty()) {
            globalUrl = env.getProperty("spring.datasource.jdbc-url");
        }
        
        if (globalUrl != null && !globalUrl.trim().isEmpty()) {
            // Prefer the global/environment-provided url if the specific one is missing or is the default local host
            if (url == null || url.trim().isEmpty() 
                    || url.contains("://db:") 
                    || url.contains("://db-replica:")) {
                url = globalUrl;
            }
        }

        String username = properties.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = fallbackProperties.getUsername();
        }
        if (username == null || username.trim().isEmpty()) {
            username = env.getProperty("spring.datasource.username");
        }

        String password = properties.getPassword();
        if (password == null || password.trim().isEmpty()) {
            password = fallbackProperties.getPassword();
        }
        if (password == null || password.trim().isEmpty()) {
            password = env.getProperty("spring.datasource.password");
        }

        String driverClassName = properties.getDriverClassName();
        if (driverClassName == null || driverClassName.trim().isEmpty()) {
            driverClassName = fallbackProperties.getDriverClassName();
        }
        if (driverClassName == null || driverClassName.trim().isEmpty()) {
            driverClassName = env.getProperty("spring.datasource.driver-class-name");
        }
        if (driverClassName == null || driverClassName.trim().isEmpty()) {
            driverClassName = "com.mysql.cj.jdbc.Driver";
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driverClassName);
        
        return dataSource;
    }
}
