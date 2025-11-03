pipeline {
    agent any
    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen:latest"
        PORT_BLUE = "8081"
        PORT_GREEN = "8082"
    }
    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code from GitHub..."
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat 'echo %DOCKER_PASS% | docker login --username %DOCKER_USER% --password-stdin'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t %IMAGE_NAME% ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "Pushing Docker image to Docker Hub..."
                bat "docker push %IMAGE_NAME%"
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    // Detect active container
                    def activeContainer = bat(returnStdout: true, script: 'docker ps --filter "name=myapp-" --format "{{.Names}}"').trim()
                    def deployContainer = ""
                    def deployPort = ""

                    if (activeContainer.contains("myapp-blue")) {
                        deployContainer = "myapp-green"
                        deployPort = PORT_GREEN
                    } else if (activeContainer.contains("myapp-green")) {
                        deployContainer = "myapp-blue"
                        deployPort = PORT_BLUE
                    } else {
                        // No container running, start with blue
                        deployContainer = "myapp-blue"
                        deployPort = PORT_BLUE
                    }

                    echo "Deploying new version to inactive container: ${deployContainer} on port ${deployPort}"

                    // Remove old inactive container if exists
                    bat "docker rm -f ${deployContainer} || echo No existing container"

                    // Run new container
                    bat "docker run -d --name ${deployContainer} -p ${deployPort}:8080 %IMAGE_NAME%"

                    echo "Deployment complete. New container ${deployContainer} running on port ${deployPort}"
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
        success {
            echo "Deployment succeeded!"
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
