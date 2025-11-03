pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen"
        BLUE_CONTAINER = "myapp-blue"
        GREEN_CONTAINER = "myapp-green"
        BLUE_PORT = "8090"
        GREEN_PORT = "8091"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                bat "docker build -t %IMAGE_NAME%:latest ."
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    echo 'Stopping and removing old Blue container if exists...'
                    bat """
                    set CONTAINER_ID=
                    for /F "tokens=*" %%i in ('docker ps -aq -f "name=%BLUE_CONTAINER%"') do set CONTAINER_ID=%%i
                    if not "%CONTAINER_ID%"=="" (
                        docker stop %CONTAINER_ID%
                        docker rm %CONTAINER_ID%
                        echo Removed old Blue container
                    ) else (
                        echo No existing Blue container to remove
                    )
                    """

                    echo 'Deploying new Blue container...'
                    bat "docker run -d --name %BLUE_CONTAINER% -p %BLUE_PORT%:8080 -e ENVIRONMENT=blue %IMAGE_NAME%:latest"

                    echo 'Stopping and removing old Green container if exists...'
                    bat """
                    set CONTAINER_ID=
                    for /F "tokens=*" %%i in ('docker ps -aq -f "name=%GREEN_CONTAINER%"') do set CONTAINER_ID=%%i
                    if not "%CONTAINER_ID%"=="" (
                        docker stop %CONTAINER_ID%
                        docker rm %CONTAINER_ID%
                        echo Removed old Green container
                    ) else (
                        echo No existing Green container to remove
                    )
                    """

                    echo 'Deploying new Green container...'
                    bat "docker run -d --name %GREEN_CONTAINER% -p %GREEN_PORT%:8080 -e ENVIRONMENT=green %IMAGE_NAME%:latest"
                }
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking if containers are healthy...'
                bat """
                timeout /t 5
                curl http://localhost:%BLUE_PORT%
                curl http://localhost:%GREEN_PORT%
                """
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed. Check logs for details.'
        }
    }
}
