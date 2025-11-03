pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "muthusanjai/myapp-bluegreen:latest"
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
                echo "Logging in to Docker Hub..."
                bat """
                    echo YOUR_DOCKER_PASSWORD | docker login --username YOUR_DOCKER_USERNAME --password-stdin
                """
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image..."
                bat "docker build -t %DOCKER_IMAGE% ."
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "Pushing Docker image to Docker Hub..."
                bat "docker push %DOCKER_IMAGE%"
            }
        }

        stage('Blue-Green Deployment') {
            steps {
                script {
                    echo "Detecting active container..."
                    def active = bat(script: 'docker ps --filter "name=myapp-green" --filter "status=running" --format "{{.Names}}"', returnStdout: true).trim()
                    echo "Active container: ${active}"

                    // Determine inactive container and port
                    def inactive = active == 'myapp-green' ? 'myapp-blue' : 'myapp-green'
                    def port = active == 'myapp-green' ? '8082' : '8081'  // alternate ports

                    echo "Deploying new version to inactive container: ${inactive} on port ${port}"

                    // Remove old inactive container if it exists
                    bat "docker rm -f ${inactive} || echo No existing container"

                    // Run new container on alternate port
                    bat "docker run -d --name ${inactive} -p ${port}:8080 %DOCKER_IMAGE%"

                    echo "Deployment completed. Access new version on port ${port}"
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "Skipping health check for now (add your own check if needed)."
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline finished successfully!"
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
