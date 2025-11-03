pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen"
        BLUE_CONTAINER = "myapp-blue"
        GREEN_CONTAINER = "myapp-green"
        BLUE_PORT = "8090"
        GREEN_PORT = "8091"
        DOCKER_USERNAME = "muthusanjai"
        DOCKER_PASSWORD = "sNCByxHR$Tw9eb!"  // Consider using Jenkins Credentials for security
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
                bat """
                    docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                    docker push %IMAGE_NAME%:latest
                """
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Function to stop and remove container if exists
                    def removeContainer(containerName) {
                        echo "Stopping and removing ${containerName} if exists..."
                        bat """
                        for /F "tokens=*" %%i in ('docker ps -aq -f "name=%${containerName}%"') do (
                            docker stop %%i
                            docker rm %%i
                            echo Removed container %%i
                        )
                        """
                    }

                    // Deploy a container
                    def deployContainer(containerName, port, env) {
                        echo "Deploying ${containerName} on port ${port}..."
                        bat "docker run -d --name %${containerName}% -p ${port}:3000 -e ENVIRONMENT=${env} %IMAGE_NAME%:latest"
                    }

                    // Remove old containers
                    removeContainer(BLUE_CONTAINER)
                    removeContainer(GREEN_CONTAINER)

                    // Deploy new containers
                    deployContainer(BLUE_CONTAINER, BLUE_PORT, "blue")
                    deployContainer(GREEN_CONTAINER, GREEN_PORT, "green")
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
