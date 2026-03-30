package com.smartcampus.maintenance;

import io.github.cdimascio.dotenv.Dotenv;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.smartcampus")
@EnableScheduling
@EntityScan(
        basePackages = {
            "com.smartcampus.maintenance",
            "com.smartcampus.user",
            "com.smartcampus.facilities",
            "com.smartcampus.notification"
        })
@EnableJpaRepositories(
        basePackages = {
            "com.smartcampus.maintenance",
            "com.smartcampus.user",
            "com.smartcampus.facilities",
            "com.smartcampus.notification"
        })
public class MaintenanceApplication {

    public static void main(String[] args) {
        loadDotenv();
        applySupabaseDatasourceFromEnv();
        SpringApplication.run(MaintenanceApplication.class, args);
    }

    /** Reads {@code backend/.env} when present; OS env vars take precedence. */
    private static void loadDotenv() {
        Dotenv dotenv = Dotenv.configure().directory("./").ignoreIfMissing().load();
        dotenv
                .entries()
                .forEach(
                        e -> {
                            String key = e.getKey();
                            if (System.getenv(key) == null && System.getProperty(key) == null) {
                                System.setProperty(key, e.getValue());
                            }
                        });
    }

    /**
     * 1) {@code DATABASE_URL} / {@code SUPABASE_DATABASE_URL} — full pooler URI from Supabase Connect (password must
     * be URL-encoded, e.g. {@code @} → {@code %40}).
     * <p>2) {@code SPRING_DATASOURCE_URL} or {@code spring.datasource.url} — JDBC URL already set (e.g. in .env); do not
     * override.
     * <p>3) {@code SUPABASE_POOLER_HOST} — exact host from Dashboard → Connect (e.g. {@code aws-1-us-east-2.pooler.supabase.com};
     * not always {@code aws-0-REGION...}).
     * <p>4) {@code SUPABASE_POOLER_REGION} — builds {@code jdbc:postgresql://aws-0-REGION.pooler...} when host is not pasted.
     */
    private static void applySupabaseDatasourceFromEnv() {
        if (datasourceUrlAlreadyConfigured()) {
            return;
        }
        String databaseUrl =
                firstNonBlank(
                        System.getProperty("DATABASE_URL"),
                        System.getProperty("SUPABASE_DATABASE_URL"),
                        System.getenv("DATABASE_URL"),
                        System.getenv("SUPABASE_DATABASE_URL"));
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            applyPostgresUriToSpringProperties(databaseUrl.trim());
            return;
        }
        String poolerHost =
                firstNonBlank(
                        System.getProperty("SUPABASE_POOLER_HOST"),
                        System.getenv("SUPABASE_POOLER_HOST"));
        if (poolerHost != null && !poolerHost.isBlank()) {
            String jdbc =
                    String.format(
                            "jdbc:postgresql://%s:6543/postgres?sslmode=require&prepareThreshold=0",
                            poolerHost.trim());
            System.setProperty("spring.datasource.url", jdbc);
            return;
        }
        String region =
                firstNonBlank(
                        System.getProperty("SUPABASE_POOLER_REGION"),
                        System.getenv("SUPABASE_POOLER_REGION"));
        if (region != null && !region.isBlank()) {
            String jdbc =
                    String.format(
                            "jdbc:postgresql://aws-0-%s.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0",
                            region.trim());
            System.setProperty("spring.datasource.url", jdbc);
        }
    }

    private static boolean datasourceUrlAlreadyConfigured() {
        String direct =
                firstNonBlank(
                        System.getProperty("spring.datasource.url"),
                        System.getProperty("SPRING_DATASOURCE_URL"),
                        System.getenv("SPRING_DATASOURCE_URL"));
        return direct != null && !direct.isBlank();
    }

    private static void applyPostgresUriToSpringProperties(String raw) {
        if (raw.startsWith("jdbc:")) {
            System.setProperty("spring.datasource.url", raw);
            return;
        }
        if (!raw.startsWith("postgresql://") && !raw.startsWith("postgres://")) {
            return;
        }
        String httpish = raw.replaceFirst("^postgres(ql)?://", "http://");
        URI uri = URI.create(httpish);
        String userInfo = uri.getUserInfo();
        if (userInfo == null) {
            return;
        }
        int colon = userInfo.indexOf(':');
        String user =
                URLDecoder.decode(
                        colon < 0 ? userInfo : userInfo.substring(0, colon), StandardCharsets.UTF_8);
        String pass =
                colon < 0
                        ? ""
                        : URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8);
        String host = uri.getHost();
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path =
                uri.getPath() != null && !uri.getPath().isEmpty() ? uri.getPath() : "/postgres";
        String query = "sslmode=require";
        if (host != null && host.contains("pooler.supabase.com")) {
            query += "&prepareThreshold=0";
        }
        String jdbc = String.format("jdbc:postgresql://%s:%d%s?%s", host, port, path, query);
        System.setProperty("spring.datasource.url", jdbc);
        System.setProperty("spring.datasource.username", user);
        System.setProperty("spring.datasource.password", pass);
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }
}
