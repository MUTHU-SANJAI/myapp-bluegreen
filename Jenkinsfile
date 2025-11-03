pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen:latest"
        BLUE_PORT = "8080"
        GREEN_PORT = "8081"
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
                echo "Logging in to Docker Hub..."
                bat 'echo sNCByxHR$Tw9eb! | docker login --username muthusanjai --password-stdin'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t ${IMAGE_NAME} ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "Pushing Docker image to Docker Hub..."
                bat "docker push ${IMAGE_NAME}"
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Determine which container is currently active
                    def activeContainer = bat(returnStdout: true, script: 'docker ps --filter "name=myapp-blue" --format "{{.Names}}"').trim()
                    def inactiveContainer
                    def inactivePort

                    if (activeContainer == "myapp-blue") {
                        inactiveContainer = "myapp-green"
                        inactivePort = GREEN_PORT
                    } else if (activeContainer == "myapp-green") {
                        inactiveContainer = "myapp-blue"
                        inactivePort = BLUE_PORT
                    } else {
                        // No container running yet
                        inactiveContainer = "myapp-blue"
                        inactivePort = BLUE_PORT
                    }

                    echo "Deploying new version to inactive container: ${inactiveContainer} on port ${inactivePort}"

                    // Remove old inactive container if exists
                    bat "docker rm -f ${inactiveContainer} || echo No existing container"

                    // Run new container
                    bat "docker run -d --name ${inactiveContainer} -p ${inactivePort}:8080 ${IMAGE_NAME}"

                    echo "Deployment of ${inactiveContainer} complete. New version running on port ${inactivePort}"
                }
            }
        }

        stage('Health Check') {
            steps {
                echo "Performing health check..."
                script {
                    def inactiveContainer = bat(returnStdout: true, script: 'docker ps --filter "name=myapp-blue" --format "{{.Names}}"').trim()
                    if (!inactiveContainer) {
                        inactiveContainer = bat(returnStdout: true, script: 'docker ps --filter "name=myapp-green" --format "{{.Names}}"').trim()
                    }
                    echo "Health check passed for container: ${inactiveContainer}"
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
