# ── Stage 1 : Build avec Maven ────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY src src
RUN ./mvnw package -DskipTests -q

# ── Stage 2 : Image finale légère ─────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S dindor && adduser -S dindor -G dindor
COPY --from=builder /app/target/*.jar app.jar
RUN mkdir -p logs uploads && chown -R dindor:dindor /app
USER dindor
EXPOSE 8099
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
