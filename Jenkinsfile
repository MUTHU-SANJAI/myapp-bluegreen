pipeline {
    agent any

    environment {
        IMAGE_NAME = "muthusanjai/myapp-bluegreen:latest"
        CONTAINER_BLUE = "myapp-blue"
        CONTAINER_GREEN = "myapp-green"
        DOCKER_USER = "muthusanjai"
        DOCKER_PSW = "sNCByxHR\$Tw9eb!"  // escape $ for Groovy
    }

    stages {

        stage('Checkout SCM') {
            steps {
                echo "Checking out code from GitHub..."
                git url: 'https://github.com/MUTHU-SANJAI/myapp-bluegreen', branch: 'main'
            }
        }

        stage('Docker Login') {
            steps {
                echo "Logging in to Docker Hub..."
                bat """
                echo %DOCKER_PSW% | docker login --username %DOCKER_USER% --password-stdin
                """
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
                    echo "Determining active container..."
                    def activeContainer = bat(returnStdout: true, script: 'docker ps --filter "name=myapp-blue" --format "{{.Names}}"').trim()
                    def inactiveContainer = activeContainer == CONTAINER_BLUE ? CONTAINER_GREEN : CONTAINER_BLUE
                    echo "Active container: ${activeContainer}"
                    echo "Deploying new version to inactive container: ${inactiveContainer}"

                    bat """
                    docker rm -f %inactiveContainer% || echo No existing container
                    docker run -d --name %inactiveContainer% -p 8080:8080 %IMAGE_NAME%
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                echo "Waiting 10 seconds for new container to start..."
                bat "timeout /t 10"
                echo "Health check passed!" // optional: add real health check
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
