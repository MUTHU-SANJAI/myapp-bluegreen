pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen"
        BLUE_CONTAINER = "myapp-blue"
        GREEN_CONTAINER = "myapp-green"
        BLUE_PORT = "8090"
        GREEN_PORT = "8091"
        DOCKER_USERNAME = "muthusanjai"
        DOCKER_PASSWORD = "sNCByxHR$Tw9eb!"  // Ideally use Jenkins credentials
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

        stage('Push Docker Image') {
            steps {
                echo 'Logging in to Docker Hub and pushing image...'
                // Non-interactive Docker login
                bat """
                    echo %DOCKER_PASSWORD% | docker login -u %DOCKER_USERNAME% --password-stdin
                    docker push %IMAGE_NAME%:latest
                """
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                echo 'Stopping old containers if they exist...'
                bat """
                    for /F "tokens=*" %%i in ('docker ps -aq -f "name=%BLUE_CONTAINER%"') do (
                        docker stop %%i
                        docker rm %%i
                    )
                    for /F "tokens=*" %%i in ('docker ps -aq -f "name=%GREEN_CONTAINER%"') do (
                        docker stop %%i
                        docker rm %%i
                    )
                """

                echo 'Deploying Blue container...'
                bat "docker run -d --name %BLUE_CONTAINER% -p %BLUE_PORT%:3000 %IMAGE_NAME%:latest"

                echo 'Deploying Green container...'
                bat "docker run -d --name %GREEN_CONTAINER% -p %GREEN_PORT%:3000 %IMAGE_NAME%:latest"
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking containers...'
                bat """
                    timeout /t 5 /nobreak >nul
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
