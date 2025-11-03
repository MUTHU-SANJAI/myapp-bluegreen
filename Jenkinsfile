pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen"
        BLUE_CONTAINER = "myapp-blue"
        GREEN_CONTAINER = "myapp-green"
        BLUE_PORT = "8090"
        GREEN_PORT = "8091"
        DOCKER_USERNAME = "muthusanjai"
        DOCKER_PASSWORD = "sNCByxHR$Tw9eb!"  // Ideally use Jenkins credentials for security
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
                echo 'Logging in to Docker Hub...'
                bat "docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%"
                echo 'Pushing Docker image...'
                bat "docker push %IMAGE_NAME%:latest"
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Determine which container is currently active
                    def activeContainer = bat(returnStdout: true, script: "docker ps --filter \"name=%BLUE_CONTAINER%\" --format \"{{.Names}}\"").trim()
                    def inactiveContainer = activeContainer == BLUE_CONTAINER ? GREEN_CONTAINER : BLUE_CONTAINER
                    def inactivePort = inactiveContainer == BLUE_CONTAINER ? BLUE_PORT : GREEN_PORT

                    echo "Active container: ${activeContainer ?: 'None'}"
                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    echo "Stopping old inactive container if exists..."
                    bat "for /F \"tokens=*\" %%i in ('docker ps -aq -f \"name=${inactiveContainer}\"') do docker stop %%i"
                    bat "for /F \"tokens=*\" %%i in ('docker ps -aq -f \"name=${inactiveContainer}\"') do docker rm %%i"

                    echo "Running new inactive container..."
                    bat "docker run -d --name ${inactiveContainer} -p ${inactivePort}:3000 -e ENVIRONMENT=${inactiveContainer} %IMAGE_NAME%:latest"

                    echo "Waiting 5 seconds for container to start..."
                    bat "timeout /t 5 /nobreak >nul"

                    echo "Health check..."
                    bat "curl http://localhost:${inactivePort}"

                    echo "Switching traffic to new container..."
                    if (inactiveContainer == BLUE_CONTAINER) {
                        bat "docker stop %GREEN_CONTAINER%"
                        bat "docker rm %GREEN_CONTAINER%"
                    } else {
                        bat "docker stop %BLUE_CONTAINER%"
                        bat "docker rm %BLUE_CONTAINER%"
                    }

                    echo "Deployment of ${inactiveContainer} completed successfully!"
                }
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking if containers are healthy...'
                bat "curl http://localhost:%BLUE_PORT%"
                bat "curl http://localhost:%GREEN_PORT%"
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
