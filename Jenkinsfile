pipeline {
    agent any

    environment {
        IMAGE_NAME = 'muthusanjai/myapp-bluegreen'
        DOCKER_CRED_ID = 'docker-hub-cred'
        PORT_BLUE = '8081'
        PORT_GREEN = '8082'
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo "Checking out code from GitHub..."
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                script {
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: env.DOCKER_CRED_ID,
                                usernameVariable: 'DOCKER_USER',
                                passwordVariable: 'DOCKER_PASS'
                            )
                        ]) {
                            bat 'echo %DOCKER_PASS% | docker login --username %DOCKER_USER% --password-stdin'
                        }
                    } catch (err) {
                        echo "Docker Hub credentials not found, skipping login."
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: env.DOCKER_CRED_ID,
                                usernameVariable: 'DOCKER_USER',
                                passwordVariable: 'DOCKER_PASS'
                            )
                        ]) {
                            echo "Pushing Docker image to Docker Hub..."
                            bat "docker push ${IMAGE_NAME}:latest"
                        }
                    } catch (err) {
                        echo "Skipping push because Docker credentials are missing."
                    }
                }
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Detect all running containers with myapp- prefix
                    def runningContainers = bat(
                        script: '@docker ps --filter "name=myapp-" --format "{{.Names}}" 2>nul',
                        returnStdout: true
                    ).trim()

                    def inactiveContainer = ''
                    def port = ''

                    echo "Currently running containers: ${runningContainers}"

                    // Determine which container to deploy to
                    if (runningContainers.contains('myapp-blue')) {
                        inactiveContainer = 'myapp-green'
                        port = PORT_GREEN
                        echo "Blue is active, deploying to Green"
                    } else {
                        inactiveContainer = 'myapp-blue'
                        port = PORT_BLUE
                        echo "Green is active (or none active), deploying to Blue"
                    }

                    echo "Deploying new version to: ${inactiveContainer} on port ${port}"

                    // Remove existing inactive container if it exists
                    bat "@docker rm -f ${inactiveContainer} 2>nul || echo Container does not exist, proceeding..."

                    // Start new inactive container
                    bat "docker run -d --name ${inactiveContainer} -p ${port}:8080 ${IMAGE_NAME}:latest"

                    // Store the deployed container name for health check
                    env.DEPLOYED_CONTAINER = inactiveContainer
                    env.DEPLOYED_PORT = port

                    echo "Deployment complete. New container ${inactiveContainer} is running on port ${port}"
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def containerName = env.DEPLOYED_CONTAINER
                    def port = env.DEPLOYED_PORT

                    echo "Starting health check for ${containerName} on port ${port}..."

                    def maxRetries = 10
                    def success = false

                    for (int i = 1; i <= maxRetries; i++) {
                        echo "Health check attempt ${i} of ${maxRetries}..."

                        try {
                            // Use curl to get HTTP status code
                            def curlOutput = bat(
                                script: "@curl -s -o nul -w \"%%{http_code}\" http://localhost:${port} 2>nul",
                                returnStdout: true
                            ).trim()

                            echo "HTTP Response Code: ${curlOutput}"

                            if (curlOutput == '200') {
                                echo "✓ ${containerName} is healthy and responding!"
                                success = true
                                break
                            } else {
                                echo "✗ Received status ${curlOutput}, expected 200. Retrying..."
                            }
                        } catch (Exception e) {
                            echo "✗ Health check failed: ${e.message}"
                        }

                        if (i < maxRetries) {
                            echo "Waiting 10 seconds before next attempt..."
                            sleep 10
                        }
                    }

                    if (!success) {
                        error "Health check failed after ${maxRetries} attempts. Rolling back..."
                    }
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                script {
                    def newContainer = env.DEPLOYED_CONTAINER
                    def oldContainer = newContainer == 'myapp-blue' ? 'myapp-green' : 'myapp-blue'

                    echo "====================================="
                    echo "New container ${newContainer} is healthy!"
                    echo "You can now:"
                    echo "1. Update your load balancer/reverse proxy to point to the new container"
                    echo "2. Or manually verify at http://localhost:${env.DEPLOYED_PORT}"
                    echo "3. Then stop the old container: docker stop ${oldContainer}"
                    echo "====================================="
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline execution completed."
        }
        success {
            echo "✓ Deployment succeeded! New version is running and healthy."
        }
        failure {
            echo "✗ Deployment failed. Check the logs above for details."
            script {
                // Optionally rollback by removing the failed container
                if (env.DEPLOYED_CONTAINER) {
                    echo "Cleaning up failed deployment..."
                    bat "@docker rm -f ${env.DEPLOYED_CONTAINER} 2>nul || echo Already cleaned up"
                }
            }
        }
    }
}
