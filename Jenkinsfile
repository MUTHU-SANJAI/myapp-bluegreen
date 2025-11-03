@@ -8,7 +8,7 @@ pipeline {
        BLUE_PORT = "8090"
        GREEN_PORT = "8091"
        DOCKER_USERNAME = "muthusanjai"
        DOCKER_PASSWORD = "sNCByxHR\$Tw9eb!"  // escape $ for batch
        DOCKER_PASSWORD = "sNCByxHR$Tw9eb!"  // Consider using Jenkins Credentials for security
    }

    stages {
@@ -30,66 +30,62 @@ pipeline {
            steps {
                echo 'Logging in to Docker Hub and pushing image...'
                bat """
                docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                docker push %IMAGE_NAME%:latest
                    docker login -u %DOCKER_USERNAME% -p %DOCKER_PASSWORD%
                    docker push %IMAGE_NAME%:latest
                """
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Determine which container is currently live
                    def activeContainer = bat(returnStdout: true, script: "docker ps --filter 'name=%BLUE_CONTAINER%' --format '{{.Names}}'").trim()
                    def inactiveContainer = activeContainer == BLUE_CONTAINER ? GREEN_CONTAINER : BLUE_CONTAINER
                    def inactivePort = inactiveContainer == BLUE_CONTAINER ? BLUE_PORT : GREEN_PORT

                    echo "Active container: ${activeContainer ?: 'None'}"
                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    // Remove old inactive container if exists
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

                    // Swap ports (Blue-Green switch)
                    echo "Swapping traffic to new container..."
                    if (inactiveContainer == BLUE_CONTAINER) {
                        bat """
                        docker stop %GREEN_CONTAINER%
                        docker rm %GREEN_CONTAINER%
                        """
                    } else {
                    // Function to stop and remove container if exists
                    def removeContainer(containerName) {
                        echo "Stopping and removing ${containerName} if exists..."
                        bat """
                        docker stop %BLUE_CONTAINER%
                        docker rm %BLUE_CONTAINER%
                        for /F "tokens=*" %%i in ('docker ps -aq -f "name=%${containerName}%"') do (
                            docker stop %%i
                            docker rm %%i
                            echo Removed container %%i
                        )
                        """
                    }

                    echo "Deployment of ${inactiveContainer} completed successfully!"
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
            echo 'Pipeline completed successfully!'
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
            echo 'Deployment failed. Check logs for details.'
        }
    }
}
