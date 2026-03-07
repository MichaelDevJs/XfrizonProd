FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY xfrizon-be /app
COPY xfrizon-ui /xfrizon-ui

# Clean ALL build artifacts to force complete rebuild
# - Frontend: node_modules, dist, package-lock (fixes Rollup optional deps)
# - Backend: static resources folder where frontend is copied
RUN rm -rf /xfrizon-ui/node_modules \
	/xfrizon-ui/dist \
	/xfrizon-ui/package-lock.json \
	/app/src/main/resources/static \
	/app/target

RUN mvn -f /app/pom.xml clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java -Xmx512m -Dspring.profiles.active=prod -Dserver.port=${PORT:-8081} -jar app.jar"]
