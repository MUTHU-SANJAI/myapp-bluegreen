pipeline { 
    agent any

    environment {
        DOCKER_USER = 'muthusanjai'
        DOCKER_IMAGE = 'muthusanjai/myapp-bluegreen:latest'
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
                bat """
                echo sNCByxHR\$Tw9eb! | docker login --username %DOCKER_USER% --password-stdin
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
                    echo "Checking which container is active..."
                    
                    // Get active container (myapp-green or myapp-blue)
                    def active = bat(script: 'docker ps --filter "name=myapp-green" --filter "status=running" --format "{{.Names}}"', returnStdout: true).trim()
                    echo "Active container: ${active}"

                    // Decide inactive container and port
                    def inactive = active == 'myapp-green' ? 'myapp-blue' : 'myapp-green'
                    def port = active == 'myapp-green' ? '8081' : '8080'  // alternate port

                    echo "Deploying new version to inactive container: ${inactive} on port ${port}"

                    // Remove old inactive container if exists
                    bat "docker rm -f ${inactive} || echo No existing container"

                    // Run new container on alternate port
                    bat "docker run -d --name ${inactive} -p ${port}:8080 %DOCKER_IMAGE%"
                    
                    echo "Deployment of ${inactive} completed. Access via port ${port}"
                }
            }
        }

        stage('Health Check') {
            steps {
                echo "Health check can be implemented here if needed."
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed. Check logs for details."
        }
        success {
            echo "Pipeline completed successfully."
        }
    }
}
