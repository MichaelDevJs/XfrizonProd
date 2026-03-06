FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY xfrizon-be /app
RUN mvn -f /app/pom.xml clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java -Xmx512m -Dspring.profiles.active=prod -Dserver.port=${PORT:-8081} -jar app.jar"]
