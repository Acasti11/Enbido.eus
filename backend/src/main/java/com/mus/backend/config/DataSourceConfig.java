package com.mus.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
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
    // Primary DataSource configuration using standard DataSourceProperties
    // =========================================================================
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.primary.hikari")
    public HikariDataSource primaryDataSource() {
        return primaryDataSourceProperties()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
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
    public HikariDataSource replicaDataSource() {
        return replicaDataSourceProperties()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    // =========================================================================
    // Routing DataSource wrapped in LazyConnectionDataSourceProxy
    // =========================================================================
    @Bean
    @Primary
    public DataSource dataSource() {
        TransactionRoutingDataSource routingDataSource = new TransactionRoutingDataSource();
        
        Map<Object, Object> dataSourceMap = new HashMap<>();
        dataSourceMap.put(DataSourceType.PRIMARY, primaryDataSource());
        dataSourceMap.put(DataSourceType.REPLICA, replicaDataSource());
        
        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource());
        routingDataSource.afterPropertiesSet();
        
        return new LazyConnectionDataSourceProxy(routingDataSource);
    }
}
