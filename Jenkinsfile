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

        stage('Push Docker Image') {
            steps {
                echo 'Logging in to Docker Hub...'
                // Use Jenkins credentials (ID: docker-hub)
                withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    bat """
                        echo Logging in...
                        echo %DOCKER_PASSWORD% | docker login --username %DOCKER_USERNAME% --password-stdin
                        docker push %IMAGE_NAME%:latest
                    """
                }
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    echo 'Starting Blue-Green Deployment...'

                    // Determine which container is currently active
                    def activeContainer = bat(returnStdout: true, script: "docker ps --filter name=%BLUE_CONTAINER% --format \"{{.Names}}\"").trim()
                    def inactiveContainer = activeContainer == env.BLUE_CONTAINER ? env.GREEN_CONTAINER : env.BLUE_CONTAINER
                    def inactivePort = inactiveContainer == env.BLUE_CONTAINER ? env.BLUE_PORT : env.GREEN_PORT

                    echo "Active container: ${activeContainer ?: 'None'}"
                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    // Stop and remove old inactive container
                    bat """
                        for /F "tokens=*" %%i in ('docker ps -aq -f "name=${inactiveContainer}"') do (
                            docker stop %%i
                            docker rm %%i
                            echo Removed old ${inactiveContainer} container %%i
                        )
                    """

                    // Run new inactive container
                    bat "docker run -d --name ${inactiveContainer} -p ${inactivePort}:3000 -e ENVIRONMENT=${inactiveContainer} %IMAGE_NAME%:latest"

                    // Health check
                    echo "Waiting 5 seconds for container to start..."
                    bat "timeout /t 5"
                    bat "curl http://localhost:${inactivePort}"

                    // Optional: Stop old active container if exists
                    if (activeContainer) {
                        echo "Stopping old active container: ${activeContainer}"
                        bat """
                            docker stop ${activeContainer}
                            docker rm ${activeContainer}
                        """
                    }

                    echo "Blue-Green Deployment of ${inactiveContainer} completed successfully!"
                }
            }
        }

        stage('Health Check') {
            steps {
                echo 'Performing final health check on both containers...'
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
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
