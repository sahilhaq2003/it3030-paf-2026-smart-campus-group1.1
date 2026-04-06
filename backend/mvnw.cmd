@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script for Windows
@REM ----------------------------------------------------------------------------

@echo off
@REM set title of command window
title %0

@REM Find the project base dir
set MAVEN_PROJECTBASEDIR=%CD%
:findBaseDir
IF EXIST "%MAVEN_PROJECTBASEDIR%"\.mvn goto baseDirFound
cd ..
IF "%MAVEN_PROJECTBASEDIR%"=="%CD%" goto baseDirNotFound
set MAVEN_PROJECTBASEDIR=%CD%
goto findBaseDir

:baseDirFound
cd "%MAVEN_PROJECTBASEDIR%"
goto endDetectBaseDir

:baseDirNotFound
set MAVEN_PROJECTBASEDIR=%CD%

:endDetectBaseDir

set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

if not exist %WRAPPER_JAR% (
  echo Downloading Maven wrapper...
  powershell -Command "&{[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%' -UseBasicParsing}"
)

if "%JAVA_HOME%"=="" (
  set "JAVA_EXE=java"
) else (
  set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
)
"%JAVA_EXE%" -classpath %WRAPPER_JAR% "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
