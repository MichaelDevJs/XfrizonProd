FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

COPY xfrizon-be /app
COPY xfrizon-ui /xfrizon-ui

# FORCE CACHE INVALIDATION: Create timestamp file to bust ALL subsequent Docker layers
RUN date > /tmp/build-timestamp.txt && cat /tmp/build-timestamp.txt

# Clean ALL frontend artifacts to force complete rebuild
RUN rm -rf /xfrizon-ui/node_modules \
    /xfrizon-ui/package-lock.json \
    /xfrizon-ui/dist \
    /xfrizon-ui/.vite \
    /app/src/main/resources/static

RUN mvn -f /app/pom.xml clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java -Xmx512m -Dspring.profiles.active=prod -Dserver.port=${PORT:-8081} -jar app.jar"]
