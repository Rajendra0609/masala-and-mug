FROM tomcat:10.1-jdk11

COPY masalamug.war /usr/local/tomcat/webapps/

EXPOSE 8080

