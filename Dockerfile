FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Add build timestamp to bust Docker cache
ARG CACHEBUST=1
RUN echo "Build timestamp: $CACHEBUST"

COPY xfrizon-be /app
COPY xfrizon-ui /xfrizon-ui

# Clean npm artifacts and dist folder to force fresh build
RUN rm -rf /xfrizon-ui/node_modules /xfrizon-ui/package-lock.json /xfrizon-ui/dist

RUN mvn -f /app/pom.xml clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java -Xmx512m -Dspring.profiles.active=prod -Dserver.port=${PORT:-8081} -jar app.jar"]
